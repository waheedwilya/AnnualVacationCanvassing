import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import SupervisorDashboard from "@/components/SupervisorDashboard";
import RequestCard from "@/components/RequestCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RequestStatus } from "@/components/StatusBadge";
import type { Worker, VacationRequest } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { differenceInYears } from "date-fns";

export default function SupervisorApp() {
  const [selectedDepartment, setSelectedDepartment] = useState('all');

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

          <TabsContent value="pending" className="space-y-4">
            {convertToCardFormat(pending).map((request: any) => (
              <RequestCard
                key={request.id}
                request={request}
                onApprove={handleApprove}
                onDeny={handleDeny}
                onUpdateWeeks={handleUpdateWeeks}
                showActions={true}
              />
            ))}
            {pending.length === 0 && (
              <p className="text-center text-muted-foreground py-12">No pending requests</p>
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
