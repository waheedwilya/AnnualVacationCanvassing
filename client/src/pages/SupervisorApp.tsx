import { useState, useReducer } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { User, Check, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import SupervisorDashboard from "@/components/SupervisorDashboard";
import RequestCard from "@/components/RequestCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RequestStatus } from "@/components/StatusBadge";
import type { Worker, VacationRequest } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { differenceInYears, format, parse } from "date-fns";
import { calculateVacationWeeks } from "@shared/utils";

// State management for week approvals
type WeekAction = {
  type: 'APPROVE' | 'DENY' | 'CLEAR' | 'RESET';
  requestId?: string;
  week?: string;
};

type WeekChanges = Map<string, { approvedWeeks: Set<string>; deniedWeeks: Set<string> }>;

function weekChangesReducer(state: WeekChanges, action: WeekAction): WeekChanges {
  const newState = new Map(state);
  
  if (action.type === 'RESET') {
    return new Map();
  }
  
  if (!action.requestId || !action.week) return state;
  
  const requestChanges = newState.get(action.requestId) || {
    approvedWeeks: new Set<string>(),
    deniedWeeks: new Set<string>(),
  };
  
  if (action.type === 'APPROVE') {
    requestChanges.approvedWeeks.add(action.week);
    requestChanges.deniedWeeks.delete(action.week);
  } else if (action.type === 'DENY') {
    requestChanges.deniedWeeks.add(action.week);
    requestChanges.approvedWeeks.delete(action.week);
  } else if (action.type === 'CLEAR') {
    requestChanges.approvedWeeks.delete(action.week);
    requestChanges.deniedWeeks.delete(action.week);
  }
  
  newState.set(action.requestId, requestChanges);
  return newState;
}

export default function SupervisorApp() {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [weekChanges, dispatchWeekChange] = useReducer(weekChangesReducer, new Map());

  // Fetch all workers and vacation requests
  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ['/api/workers'],
  });

  const { data: vacationRequests = [] } = useQuery<VacationRequest[]>({
    queryKey: ['/api/vacation-requests'],
  });

  const { data: conflictsData } = useQuery<{ totalConflicts: number; conflicts: any[] }>({
    queryKey: ['/api/vacation-requests/conflicts'],
  });

  // Mutations for approve/deny
  const updateRequestStatus = useMutation({
    mutationFn: async ({ id, status, allocatedChoice }: { 
      id: string; 
      status: string;
      allocatedChoice?: string | null;
    }) => {
      const response = await apiRequest('PATCH', `/api/vacation-requests/${id}/status`, {
        status,
        allocatedChoice
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-requests/conflicts'] });
    },
  });

  // Mutation for updating individual weeks
  const updateRequestWeeks = useMutation({
    mutationFn: async ({ id, approvedWeeks, deniedWeeks }: {
      id: string;
      approvedWeeks: string[];
      deniedWeeks: string[];
    }) => {
      const response = await apiRequest('PATCH', `/api/vacation-requests/${id}/weeks`, {
        approvedWeeks,
        deniedWeeks
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-requests/conflicts'] });
    },
  });

  // Auto-allocate mutation
  const autoAllocate = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/vacation-requests/auto-allocate', {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-requests/conflicts'] });
    },
  });

  const handleApprove = (id: string) => {
    updateRequestStatus.mutate({ id, status: 'approved', allocatedChoice: 'first' });
  };

  const handleDeny = (id: string) => {
    updateRequestStatus.mutate({ id, status: 'denied', allocatedChoice: null });
  };

  const handleUpdateWeeks = (id: string, approvedWeeks: string[], deniedWeeks: string[]) => {
    updateRequestWeeks.mutate({ id, approvedWeeks, deniedWeeks });
  };

  const handleAutoAllocate = () => {
    autoAllocate.mutate();
  };

  const handleSaveWeekChanges = async (requestId: string) => {
    const changes = weekChanges.get(requestId);
    if (!changes) return;
    
    const request = vacationRequests.find(r => r.id === requestId);
    if (!request) return;
    
    // Merge existing approved/denied weeks with new changes
    const finalApprovedWeeks = new Set([
      ...(request.approvedWeeks || []),
      ...Array.from(changes.approvedWeeks),
    ]);
    const finalDeniedWeeks = new Set([
      ...(request.deniedWeeks || []),
      ...Array.from(changes.deniedWeeks),
    ]);
    
    // Remove any weeks that were toggled off
    changes.deniedWeeks.forEach(week => finalApprovedWeeks.delete(week));
    changes.approvedWeeks.forEach(week => finalDeniedWeeks.delete(week));
    
    await handleUpdateWeeks(requestId, Array.from(finalApprovedWeeks), Array.from(finalDeniedWeeks));
    
    // Clear changes for this request
    const newChanges = new Map(weekChanges);
    newChanges.delete(requestId);
    dispatchWeekChange({ type: 'RESET' });
  };

  const handleDiscardChanges = (requestId: string) => {
    const newChanges = new Map(weekChanges);
    newChanges.delete(requestId);
    dispatchWeekChange({ type: 'RESET' });
  };

  // Create worker map for quick lookup
  const workerMap = new Map(workers.map(w => [w.id, w]));

  // Normalize all vacation requests to have display status
  const normalizedRequests = vacationRequests.map(req => {
    let displayStatus: 'pending' | 'approved' | 'denied';
    // Use actual status field (auto-allocation sets this correctly now)
    displayStatus = req.status as 'pending' | 'approved' | 'denied';
    return { ...req, displayStatus };
  });

  // Filter requests by department
  const filteredRequests = normalizedRequests.filter(req => {
    if (selectedDepartment === 'all') return true;
    const worker = workerMap.get(req.workerId);
    return worker?.department === selectedDepartment;
  });

  // Get unique departments
  const departments = Array.from(new Set(workers.map(w => w.department)));

  // Calculate stats using display status
  const totalRequests = normalizedRequests.length;
  const pendingRequests = normalizedRequests.filter(r => r.displayStatus === 'pending').length;
  const approvedRequests = normalizedRequests.filter(r => r.displayStatus === 'approved').length;
  const conflicts = conflictsData?.totalConflicts || 0;

  // Separate requests by display status
  const pending = filteredRequests.filter(r => r.displayStatus === 'pending');
  const approved = filteredRequests.filter(r => r.displayStatus === 'approved');
  const allFiltered = filteredRequests;

  // Transform pending requests into choice-grouped table rows
  type ChoiceTableRow = {
    requestId: string;
    workerId: string;
    workerName: string;
    joiningDate: Date;
    yearsOfService: number;
    entitlement: number;
    department: string;
    weeks: string[];
    approvedWeeks: string[];
    deniedWeeks: string[];
  };

  const createChoiceRows = (choiceType: 'first' | 'second'): ChoiceTableRow[] => {
    return pending
      .map(req => {
        const worker = workerMap.get(req.workerId);
        if (!worker) return null;

        const weeks = choiceType === 'first' ? req.firstChoiceWeeks : req.secondChoiceWeeks;
        if (!weeks || weeks.length === 0) return null;

        const yearsOfService = differenceInYears(new Date(), new Date(worker.joiningDate));
        const entitlement = calculateVacationWeeks(worker.joiningDate);

        return {
          requestId: req.id,
          workerId: worker.id,
          workerName: worker.name,
          joiningDate: new Date(worker.joiningDate),
          yearsOfService,
          entitlement,
          department: worker.department,
          weeks,
          approvedWeeks: req.approvedWeeks || [],
          deniedWeeks: req.deniedWeeks || [],
        };
      })
      .filter((row): row is ChoiceTableRow => row !== null)
      .sort((a, b) => a.joiningDate.getTime() - b.joiningDate.getTime()); // Sort by seniority
  };

  const firstChoiceRows = createChoiceRows('first');
  const secondChoiceRows = createChoiceRows('second');

  // Convert vacation requests to the format expected by RequestCard
  const convertToCardFormat = (requests: VacationRequest[]) => {
    return requests.map(req => {
      const worker = workerMap.get(req.workerId);
      if (!worker) return null;

      const yearsOfService = differenceInYears(new Date(), new Date(worker.joiningDate));
      
      // Convert status to proper display status
      let displayStatus: RequestStatus;
      if (req.status === 'approved') {
        // With individual week approvals, just show as approved
        // Workers can see which specific weeks were approved in their view
        displayStatus = 'approved';
      } else {
        displayStatus = req.status as RequestStatus;
      }
      
      return {
        id: req.id,
        workerName: worker.name,
        joiningDate: new Date(worker.joiningDate),
        yearsOfService,
        weeksOfVacation: worker.weeksEntitled,
        department: worker.department,
        requestedWeeks: [], // Not used anymore, we show dates
        status: displayStatus,
        hasConflict: false, // We'll add this later if needed
        conflictDetails: undefined,
        firstChoiceWeeks: req.firstChoiceWeeks,
        secondChoiceWeeks: req.secondChoiceWeeks,
        allocatedChoice: req.allocatedChoice,
        approvedWeeks: req.approvedWeeks,
        deniedWeeks: req.deniedWeeks,
      };
    }).filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Supervisor Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage vacation requests for 2026
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="link-worker">
              <User className="w-4 h-4 mr-2" />
              Switch to Worker
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <SupervisorDashboard
            totalRequests={totalRequests}
            pendingRequests={pendingRequests}
            approvedRequests={approvedRequests}
            conflicts={conflicts}
            onAutoAllocate={handleAutoAllocate}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="department-filter" className="text-sm font-medium text-foreground mb-2 block">
            Filter by Department
          </label>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger id="department-filter" className="w-full md:w-64" data-testid="select-department">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({approved.length})
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">
              All ({allFiltered.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-8">
            {pending.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No pending requests</p>
            ) : (
              <>
                {/* First Choice Table */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">First Choice Requests</h2>
                  {firstChoiceRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No first choice requests</p>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Worker</TableHead>
                            <TableHead>Seniority</TableHead>
                            <TableHead>Entitlement</TableHead>
                            <TableHead>Requested Weeks</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {firstChoiceRows.map((row) => {
                            const changes = weekChanges.get(row.requestId);
                            const hasChanges = changes && (changes.approvedWeeks.size > 0 || changes.deniedWeeks.size > 0);
                            
                            return (
                              <TableRow key={`${row.requestId}-first`} data-testid={`row-first-choice-${row.requestId}`}>
                                <TableCell className="font-medium">
                                  <div>
                                    <div className="text-foreground">{row.workerName}</div>
                                    <div className="text-sm text-muted-foreground">{row.department}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>{row.yearsOfService} years</div>
                                    <div className="text-muted-foreground">
                                      {format(row.joiningDate, 'MMM yyyy')}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{row.entitlement} weeks</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-2">
                                    {row.weeks.map((week) => {
                                      const weekDate = parse(week, 'yyyy-MM-dd', new Date());
                                      const isApproved = row.approvedWeeks.includes(week) || changes?.approvedWeeks.has(week);
                                      const isDenied = row.deniedWeeks.includes(week) || changes?.deniedWeeks.has(week);
                                      const isChanged = changes?.approvedWeeks.has(week) || changes?.deniedWeeks.has(week);
                                      
                                      return (
                                        <div key={week} className="flex items-center gap-1">
                                          <span className="text-sm text-foreground">
                                            {format(weekDate, 'MMM d')}
                                          </span>
                                          {isApproved && (
                                            <Badge className="bg-success text-success-foreground">
                                              <Check className="w-3 h-3" />
                                            </Badge>
                                          )}
                                          {isDenied && (
                                            <Badge className="bg-destructive text-destructive-foreground">
                                              <X className="w-3 h-3" />
                                            </Badge>
                                          )}
                                          {!isApproved && !isDenied && (
                                            <div className="flex gap-1">
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={() => dispatchWeekChange({ type: 'APPROVE', requestId: row.requestId, week })}
                                                data-testid={`button-approve-${week}`}
                                              >
                                                <Check className="w-3 h-3 text-success" />
                                              </Button>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={() => dispatchWeekChange({ type: 'DENY', requestId: row.requestId, week })}
                                                data-testid={`button-deny-${week}`}
                                              >
                                                <X className="w-3 h-3 text-destructive" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {hasChanges && (
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        size="sm"
                                        onClick={() => handleSaveWeekChanges(row.requestId)}
                                        data-testid={`button-save-${row.requestId}`}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDiscardChanges(row.requestId)}
                                        data-testid={`button-discard-${row.requestId}`}
                                      >
                                        Discard
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Second Choice Table */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">Second Choice Requests</h2>
                  {secondChoiceRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No second choice requests</p>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Worker</TableHead>
                            <TableHead>Seniority</TableHead>
                            <TableHead>Entitlement</TableHead>
                            <TableHead>Requested Weeks</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {secondChoiceRows.map((row) => {
                            const changes = weekChanges.get(row.requestId);
                            const hasChanges = changes && (changes.approvedWeeks.size > 0 || changes.deniedWeeks.size > 0);
                            
                            return (
                              <TableRow key={`${row.requestId}-second`} data-testid={`row-second-choice-${row.requestId}`}>
                                <TableCell className="font-medium">
                                  <div>
                                    <div className="text-foreground">{row.workerName}</div>
                                    <div className="text-sm text-muted-foreground">{row.department}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>{row.yearsOfService} years</div>
                                    <div className="text-muted-foreground">
                                      {format(row.joiningDate, 'MMM yyyy')}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{row.entitlement} weeks</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-2">
                                    {row.weeks.map((week) => {
                                      const weekDate = parse(week, 'yyyy-MM-dd', new Date());
                                      const isApproved = row.approvedWeeks.includes(week) || changes?.approvedWeeks.has(week);
                                      const isDenied = row.deniedWeeks.includes(week) || changes?.deniedWeeks.has(week);
                                      
                                      return (
                                        <div key={week} className="flex items-center gap-1">
                                          <span className="text-sm text-foreground">
                                            {format(weekDate, 'MMM d')}
                                          </span>
                                          {isApproved && (
                                            <Badge className="bg-success text-success-foreground">
                                              <Check className="w-3 h-3" />
                                            </Badge>
                                          )}
                                          {isDenied && (
                                            <Badge className="bg-destructive text-destructive-foreground">
                                              <X className="w-3 h-3" />
                                            </Badge>
                                          )}
                                          {!isApproved && !isDenied && (
                                            <div className="flex gap-1">
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={() => dispatchWeekChange({ type: 'APPROVE', requestId: row.requestId, week })}
                                                data-testid={`button-approve-${week}`}
                                              >
                                                <Check className="w-3 h-3 text-success" />
                                              </Button>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={() => dispatchWeekChange({ type: 'DENY', requestId: row.requestId, week })}
                                                data-testid={`button-deny-${week}`}
                                              >
                                                <X className="w-3 h-3 text-destructive" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {hasChanges && (
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        size="sm"
                                        onClick={() => handleSaveWeekChanges(row.requestId)}
                                        data-testid={`button-save-${row.requestId}`}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDiscardChanges(row.requestId)}
                                        data-testid={`button-discard-${row.requestId}`}
                                      >
                                        Discard
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {convertToCardFormat(approved).map((request: any) => (
              <RequestCard
                key={request.id}
                request={request}
                showActions={false}
              />
            ))}
            {approved.length === 0 && (
              <p className="text-center text-muted-foreground py-12">No approved requests</p>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {convertToCardFormat(allFiltered).map((request: any) => (
              <RequestCard
                key={request.id}
                request={request}
                showActions={request.status === 'pending'}
                onApprove={handleApprove}
                onDeny={handleDeny}
              />
            ))}
            {allFiltered.length === 0 && (
              <p className="text-center text-muted-foreground py-12">No requests found</p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
