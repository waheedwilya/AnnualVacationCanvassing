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
  type: 'APPROVE' | 'DENY' | 'CLEAR' | 'CLEAR_REQUEST' | 'RESET';
  requestId?: string;
  week?: string;
};

type WeekChanges = Map<string, { approvedWeeks: Set<string>; deniedWeeks: Set<string> }>;

function weekChangesReducer(state: WeekChanges, action: WeekAction): WeekChanges {
  const newState = new Map(state);
  
  if (action.type === 'RESET') {
    return new Map();
  }
  
  if (action.type === 'CLEAR_REQUEST') {
    if (!action.requestId) return state;
    newState.delete(action.requestId);
    return newState;
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

  // Revert individual week mutation
  const revertWeek = useMutation({
    mutationFn: async ({ requestId, week }: { requestId: string; week: string }) => {
      const response = await apiRequest('POST', `/api/vacation-requests/${requestId}/revert-week`, { week });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-requests/conflicts'] });
    },
  });

  // Reset all approvals mutation
  const resetAllApprovals = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/vacation-requests/reset-all', {});
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

  const handleRevertWeek = (requestId: string, week: string) => {
    revertWeek.mutate({ requestId, week });
  };

  const handleResetAllApprovals = () => {
    if (confirm('Are you sure you want to reset all approvals? This will revert all requests back to pending status.')) {
      resetAllApprovals.mutate();
    }
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
    
    // Clear changes for only this request
    dispatchWeekChange({ type: 'CLEAR_REQUEST', requestId });
  };

  const handleDiscardChanges = (requestId: string) => {
    // Clear changes for only this request
    dispatchWeekChange({ type: 'CLEAR_REQUEST', requestId });
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

  // Group requests by department and prepare priority weeks data
  type PriorityRequestRow = {
    requestId: string;
    workerId: string;
    workerName: string;
    joiningDate: Date;
    yearsOfService: number;
    entitlement: number;
    department: string;
    prioritizedWeeks: string[];
    approvedWeeks: string[];
    deniedWeeks: string[];
    conflictingWeeks: Set<string>; // Weeks that conflict with other workers in same department
  };

  // Get all weeks for a request (prioritized or legacy)
  const getRequestWeeks = (req: VacationRequest): string[] => {
    if (req.prioritizedWeeks && req.prioritizedWeeks.length > 0) {
      return req.prioritizedWeeks;
    }
    return [...(req.firstChoiceWeeks || []), ...(req.secondChoiceWeeks || [])];
  };

  // Create request rows with priority weeks
  const createPriorityRows = (requests: VacationRequest[]): PriorityRequestRow[] => {
    return requests
      .map(req => {
        const worker = workerMap.get(req.workerId);
        if (!worker) return null;

        const prioritizedWeeks = getRequestWeeks(req);
        if (prioritizedWeeks.length === 0) return null;

        const yearsOfService = differenceInYears(new Date(), new Date(worker.joiningDate));
        const entitlement = calculateVacationWeeks(worker.joiningDate);

        // Find conflicting weeks (weeks that appear in other workers' requests in same department)
        const conflictingWeeks = new Set<string>();
        for (const otherReq of requests) {
          if (otherReq.id === req.id) continue;
          const otherWorker = workerMap.get(otherReq.workerId);
          if (!otherWorker || otherWorker.department !== worker.department) continue;
          
          const otherWeeks = getRequestWeeks(otherReq);
          for (const week of prioritizedWeeks) {
            if (otherWeeks.includes(week)) {
              conflictingWeeks.add(week);
            }
          }
        }

        return {
          requestId: req.id,
          workerId: worker.id,
          workerName: worker.name,
          joiningDate: new Date(worker.joiningDate),
          yearsOfService,
          entitlement,
          department: worker.department,
          prioritizedWeeks,
          approvedWeeks: req.approvedWeeks || [],
          deniedWeeks: req.deniedWeeks || [],
          conflictingWeeks,
        };
      })
      .filter((row): row is PriorityRequestRow => row !== null)
      .sort((a, b) => a.joiningDate.getTime() - b.joiningDate.getTime()); // Sort by seniority
  };

  // Group rows by department
  const priorityRows = createPriorityRows(pending);
  const rowsByDepartment = new Map<string, PriorityRequestRow[]>();
  
  for (const row of priorityRows) {
    if (!rowsByDepartment.has(row.department)) {
      rowsByDepartment.set(row.department, []);
    }
    rowsByDepartment.get(row.department)!.push(row);
  }
  
  // Sort pending departments alphabetically
  const pendingDepartments = Array.from(rowsByDepartment.keys()).sort();

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
        prioritizedWeeks: req.prioritizedWeeks,
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
            onResetAllApprovals={handleResetAllApprovals}
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
                {/* Grouped by Department */}
                {pendingDepartments.map((dept) => {
                  const deptRows = rowsByDepartment.get(dept) || [];
                  if (deptRows.length === 0) return null;
                  
                  return (
                    <div key={dept} className="space-y-4">
                      <div className="bg-primary/10 border-l-4 border-primary px-4 py-2 rounded">
                        <h2 className="text-xl font-semibold text-foreground">{dept} Department</h2>
                        <p className="text-sm text-muted-foreground">{deptRows.length} request{deptRows.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Worker</TableHead>
                              <TableHead>Seniority</TableHead>
                              <TableHead>Entitlement</TableHead>
                              <TableHead>Priority Weeks (in order)</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {deptRows.map((row) => {
                            const changes = weekChanges.get(row.requestId);
                            const hasChanges = changes && (changes.approvedWeeks.size > 0 || changes.deniedWeeks.size > 0);
                            
                            const approvedCount = row.approvedWeeks.length + (changes?.approvedWeeks.size || 0);
                            const totalWeeks = row.prioritizedWeeks.length;
                            
                            return (
                              <TableRow key={row.requestId} data-testid={`row-priority-${row.requestId}`}>
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
                                    {row.prioritizedWeeks.map((week, priorityIndex) => {
                                      const weekDate = parse(week, 'yyyy-MM-dd', new Date());
                                      const isApproved = row.approvedWeeks.includes(week) || changes?.approvedWeeks.has(week);
                                      const isDenied = row.deniedWeeks.includes(week) || changes?.deniedWeeks.has(week);
                                      const isChanged = changes?.approvedWeeks.has(week) || changes?.deniedWeeks.has(week);
                                      const isConflict = row.conflictingWeeks.has(week);
                                      
                                      return (
                                        <div 
                                          key={week} 
                                          className={`flex items-center gap-1.5 p-1.5 rounded border ${
                                            isConflict 
                                              ? 'border-yellow-500 bg-yellow-50' 
                                              : isApproved 
                                                ? 'border-green-500 bg-green-50' 
                                                : isDenied 
                                                  ? 'border-red-500 bg-red-50' 
                                                  : 'border-border bg-card'
                                          }`}
                                        >
                                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                                            {priorityIndex + 1}
                                          </span>
                                          <span className="text-sm text-foreground">
                                            {format(weekDate, 'MMM d')}
                                          </span>
                                          {isConflict && (
                                            <span className="text-xs text-yellow-700 font-medium">⚠</span>
                                          )}
                                          {isApproved && (
                                            <div className="flex items-center gap-1">
                                              <Badge className="bg-success text-success-foreground">
                                                <Check className="w-3 h-3" />
                                              </Badge>
                                              {!isChanged && (
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-5 w-5"
                                                  onClick={() => handleRevertWeek(row.requestId, week)}
                                                  data-testid={`button-revert-${week}`}
                                                  title="Revert approval"
                                                >
                                                  <X className="w-3 h-3" />
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                          {isDenied && (
                                            <div className="flex items-center gap-1">
                                              <Badge className="bg-destructive text-destructive-foreground">
                                                <X className="w-3 h-3" />
                                              </Badge>
                                              {!isChanged && (
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-5 w-5"
                                                  onClick={() => handleRevertWeek(row.requestId, week)}
                                                  data-testid={`button-revert-${week}`}
                                                  title="Revert denial"
                                                >
                                                  <X className="w-3 h-3" />
                                                </Button>
                                              )}
                                            </div>
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
                                <TableCell>
                                  <Badge variant={approvedCount > 0 ? "default" : "secondary"}>
                                    {approvedCount}/{row.entitlement} Approved
                                  </Badge>
                                  {hasChanges && (
                                    <div className="flex gap-2 mt-2">
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
                  
                  {/* Conflict warning for department */}
                  {deptRows.some(row => row.conflictingWeeks.size > 0) && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                      <p className="text-sm text-yellow-800">
                        <strong>⚠ Conflicts detected:</strong> Some weeks are requested by multiple workers in {dept}. 
                        Higher seniority workers will be prioritized during auto-allocation.
                      </p>
                    </div>
                  )}
                </div>
                  );
                })}
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
