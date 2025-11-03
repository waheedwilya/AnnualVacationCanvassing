import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Home, FileText, Calendar, User, LogOut, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import WorkerDashboard from "@/components/WorkerDashboard";
import VacationRequestForm from "@/components/VacationRequestForm";
import MyRequestsList from "@/components/MyRequestsList";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Worker, VacationRequest } from "@shared/schema";
import { differenceInYears, format } from "date-fns";
import { calculateVacationWeeks, getVacationEntitlementDescription } from "@shared/utils";

type WorkerView = 'dashboard' | 'request' | 'my-requests' | 'profile';

export default function WorkerApp() {
  const [currentView, setCurrentView] = useState<WorkerView>('dashboard');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get logged-in worker from localStorage
  let initialWorker: Worker | null = null;
  let workerId: string | undefined;
  
  try {
    const currentWorkerData = localStorage.getItem('currentWorker');
    initialWorker = currentWorkerData ? JSON.parse(currentWorkerData) : null;
    workerId = initialWorker?.id;
  } catch (error) {
    // If parsing fails, clear localStorage and redirect to login
    localStorage.removeItem('currentWorker');
    setLocation('/login');
  }

  // Fetch fresh worker data from API to reflect any profile updates
  const { data: currentWorker } = useQuery<Worker>({
    queryKey: [`/api/workers/${workerId}`],
    enabled: !!workerId,
    initialData: initialWorker || undefined,
  });

  const handleLogout = () => {
    localStorage.removeItem('currentWorker');
    setLocation('/login');
  };
  
  // Fetch vacation requests for this worker
  const { data: vacationRequests = [] } = useQuery<VacationRequest[]>({
    queryKey: [`/api/vacation-requests?workerId=${workerId}`],
    enabled: !!workerId,
  });
  
  // Submit vacation request mutation
  const submitRequest = useMutation({
    mutationFn: async (data: {
      firstChoiceWeeks: string[];
      secondChoiceWeeks: string[];
    }) => {
      if (!workerId) throw new Error("Worker ID not found");
      
      const response = await apiRequest('POST', '/api/vacation-requests', {
        workerId,
        year: 2026,
        ...data,
        status: 'pending',
        allocatedChoice: null
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit vacation request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vacation-requests?workerId=${workerId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-requests'] });
      toast({
        title: "Request Submitted",
        description: "Your vacation request has been submitted successfully.",
      });
      setCurrentView('my-requests');
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!currentWorker) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const yearsOfService = differenceInYears(new Date(), new Date(currentWorker.joiningDate));
  const weeksEntitled = calculateVacationWeeks(currentWorker.joiningDate);
  const pendingRequests = vacationRequests.filter(r => r.status === 'pending').length;
  const approvedRequests = vacationRequests.filter(r => r.status === 'approved').length;

  const navItems = [
    { id: 'dashboard' as const, label: 'Home', icon: Home },
    { id: 'request' as const, label: 'New Request', icon: FileText },
    { id: 'my-requests' as const, label: 'My Requests', icon: Calendar },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with logout button */}
      <header className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Worker Portal</h1>
          <p className="text-sm text-muted-foreground">{currentWorker.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/supervisor">
            <Button variant="outline" size="sm" data-testid="link-supervisor">
              <Shield className="w-4 h-4 mr-2" />
              Supervisor
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {currentView === 'dashboard' && (
          <WorkerDashboard
            workerName={currentWorker.name}
            weeksEntitled={weeksEntitled}
            weeksRequested={vacationRequests.length * weeksEntitled}
            weeksApproved={approvedRequests * weeksEntitled}
            submissionDeadline={new Date('2025-12-31')}
            pendingRequests={pendingRequests}
            approvedRequests={approvedRequests}
          />
        )}
        
        {currentView === 'request' && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6">New Vacation Request</h1>
            <VacationRequestForm 
              availableWeeks={weeksEntitled}
              isSubmitting={submitRequest.isPending}
              onSubmit={(firstWeeks, secondWeeks) => {
                submitRequest.mutate({
                  firstChoiceWeeks: firstWeeks.map(w => format(w, 'yyyy-MM-dd')),
                  secondChoiceWeeks: secondWeeks.map(w => format(w, 'yyyy-MM-dd')),
                });
              }}
            />
          </div>
        )}
        
        {currentView === 'my-requests' && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6">My Vacation Requests</h1>
            <MyRequestsList requests={vacationRequests.map(req => ({
              id: req.id,
              choice: (req.allocatedChoice === 'first' || req.allocatedChoice === 'second') 
                ? req.allocatedChoice 
                : undefined as any,
              weeks: [],
              status: req.status === 'approved' 
                ? (req.allocatedChoice === 'first' ? 'awarded_first' : 'awarded_second')
                : req.status as any,
              submittedDate: new Date(req.submittedAt),
              firstChoiceWeeks: req.firstChoiceWeeks,
              secondChoiceWeeks: req.secondChoiceWeeks,
              approvedWeeks: req.approvedWeeks,
              deniedWeeks: req.deniedWeeks,
            }))} />
          </div>
        )}
        
        {currentView === 'profile' && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6">My Profile</h1>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium text-foreground">{currentWorker.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Joining Date</p>
                <p className="text-lg font-medium text-foreground">
                  {new Date(currentWorker.joiningDate).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Years of Service</p>
                <p className="text-lg font-medium text-foreground">{yearsOfService} years</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="text-lg font-medium text-foreground">{currentWorker.department}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Vacation Entitlement</p>
                <p className="text-lg font-medium text-primary">
                  {getVacationEntitlementDescription(yearsOfService, weeksEntitled)}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="border-t bg-card sticky bottom-0">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`nav-${item.id}`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
