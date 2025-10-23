import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const handleAutoAllocate = () => {
    autoAllocate.mutate();
  };

  // Create worker map for quick lookup
  const workerMap = new Map(workers.map(w => [w.id, w]));

  // Filter requests by department
  const filteredRequests = vacationRequests.filter(req => {
    if (selectedDepartment === 'all') return true;
    const worker = workerMap.get(req.workerId);
    return worker?.department === selectedDepartment;
  });

  // Get unique departments
  const departments = Array.from(new Set(workers.map(w => w.department)));

  // Calculate stats
  const totalRequests = vacationRequests.length;
  const pendingRequests = vacationRequests.filter(r => r.status === 'pending').length;
  const approvedRequests = vacationRequests.filter(r => r.status === 'approved').length;
  const conflicts = conflictsData?.totalConflicts || 0;

  // Separate requests by status
  const pending = filteredRequests.filter(r => r.status === 'pending');
  const approved = filteredRequests.filter(r => r.status === 'approved');
  const allFiltered = filteredRequests;

  // Convert vacation requests to the format expected by RequestCard
  const convertToCardFormat = (requests: VacationRequest[]) => {
    return requests.map(req => {
      const worker = workerMap.get(req.workerId);
      if (!worker) return null;

      const yearsOfService = differenceInYears(new Date(), new Date(worker.joiningDate));
      
      return {
        id: req.id,
        workerName: worker.name,
        joiningDate: new Date(worker.joiningDate),
        yearsOfService,
        weeksOfVacation: worker.weeksEntitled,
        department: worker.department,
        requestedWeeks: [], // Not used anymore, we show dates
        status: req.status as RequestStatus,
        hasConflict: false, // We'll add this later if needed
        conflictDetails: undefined,
        firstChoiceStart: req.firstChoiceStart,
        firstChoiceEnd: req.firstChoiceEnd,
        secondChoiceStart: req.secondChoiceStart,
        secondChoiceEnd: req.secondChoiceEnd,
        allocatedChoice: req.allocatedChoice,
      };
    }).filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">Supervisor Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage vacation requests for 2026
          </p>
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
