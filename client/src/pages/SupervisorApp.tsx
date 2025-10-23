import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SupervisorDashboard from "@/components/SupervisorDashboard";
import RequestCard from "@/components/RequestCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RequestStatus } from "@/components/StatusBadge";

interface VacationRequest {
  id: string;
  workerName: string;
  joiningDate: Date;
  yearsOfService: number;
  weeksOfVacation: number;
  department: string;
  requestedWeeks: { week: number; choice: 'first' | 'second' }[];
  status: RequestStatus;
  hasConflict?: boolean;
  conflictDetails?: string;
}

export default function SupervisorApp() {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [requests, setRequests] = useState<VacationRequest[]>([
    {
      id: '1',
      workerName: 'Sarah Martinez',
      joiningDate: new Date('2015-06-15'),
      yearsOfService: 10,
      weeksOfVacation: 4,
      department: 'Assembly Line B',
      requestedWeeks: [
        { week: 12, choice: 'first' as const },
        { week: 13, choice: 'first' as const },
        { week: 14, choice: 'first' as const },
        { week: 15, choice: 'first' as const },
        { week: 26, choice: 'second' as const },
        { week: 27, choice: 'second' as const },
        { week: 28, choice: 'second' as const },
        { week: 29, choice: 'second' as const },
      ],
      status: 'pending' as const,
      hasConflict: true,
      conflictDetails: '3 other workers requested week 12-13. Seniority-based allocation recommended.',
    },
    {
      id: '2',
      workerName: 'Andy Stouffer',
      joiningDate: new Date('1988-04-04'),
      yearsOfService: 37,
      weeksOfVacation: 6,
      department: 'Assembly Line A',
      requestedWeeks: [
        { week: 12, choice: 'first' as const },
        { week: 13, choice: 'first' as const },
        { week: 14, choice: 'first' as const },
        { week: 15, choice: 'first' as const },
        { week: 16, choice: 'first' as const },
        { week: 17, choice: 'first' as const },
        { week: 26, choice: 'second' as const },
        { week: 27, choice: 'second' as const },
        { week: 28, choice: 'second' as const },
        { week: 29, choice: 'second' as const },
        { week: 30, choice: 'second' as const },
        { week: 31, choice: 'second' as const },
      ],
      status: 'pending' as const,
      hasConflict: true,
      conflictDetails: 'Multiple conflicts with Assembly Line A workers. Higher seniority.',
    },
    {
      id: '3',
      workerName: 'Michael Chen',
      joiningDate: new Date('2018-03-20'),
      yearsOfService: 7,
      weeksOfVacation: 3,
      department: 'Quality Control',
      requestedWeeks: [
        { week: 20, choice: 'first' as const },
        { week: 21, choice: 'first' as const },
        { week: 22, choice: 'first' as const },
        { week: 35, choice: 'second' as const },
        { week: 36, choice: 'second' as const },
        { week: 37, choice: 'second' as const },
      ],
      status: 'awarded_first' as const,
    },
  ]);

  const handleApprove = (id: string) => {
    console.log('Approving request:', id);
    setRequests(prev => 
      prev.map(r => r.id === id ? { ...r, status: 'awarded_first' as const, hasConflict: false, conflictDetails: undefined } : r)
    );
  };

  const handleDeny = (id: string) => {
    console.log('Denying request:', id);
    setRequests(prev => 
      prev.map(r => r.id === id ? { ...r, status: 'denied' as const, hasConflict: false, conflictDetails: undefined } : r)
    );
  };

  const handleAutoAllocate = () => {
    console.log('Auto-allocating based on seniority...');
    // Simulate auto-allocation
    setRequests(prev => 
      prev.map(r => {
        if (r.status === 'pending') {
          // Higher seniority gets approved
          return r.yearsOfService > 15 
            ? { ...r, status: 'awarded_first' as const, hasConflict: false, conflictDetails: undefined }
            : { ...r, status: 'awarded_second' as const, hasConflict: false, conflictDetails: undefined };
        }
        return r;
      })
    );
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status.startsWith('awarded'));
  const conflicts = requests.filter(r => r.hasConflict).length;

  const filteredRequests = selectedDepartment === 'all' 
    ? requests 
    : requests.filter(r => r.department === selectedDepartment);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">Supervisor Portal</h1>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">
              All Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <SupervisorDashboard
              totalRequests={requests.length}
              pendingRequests={pendingRequests.length}
              approvedRequests={approvedRequests.length}
              conflicts={conflicts}
              onAutoAllocate={handleAutoAllocate}
            />

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-foreground">Filter by Department:</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-64" data-testid="select-department">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Assembly Line A">Assembly Line A</SelectItem>
                  <SelectItem value="Assembly Line B">Assembly Line B</SelectItem>
                  <SelectItem value="Quality Control">Quality Control</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {filteredRequests
                .filter(r => r.status === 'pending')
                .map(request => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onApprove={handleApprove}
                    onDeny={handleDeny}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="approved" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {requests
                .filter(r => r.status.startsWith('awarded'))
                .map(request => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    showActions={false}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {requests.map(request => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                  showActions={request.status === 'pending'}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
