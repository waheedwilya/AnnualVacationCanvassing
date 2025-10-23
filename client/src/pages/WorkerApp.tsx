import { useState } from "react";
import { Home, FileText, Calendar, User } from "lucide-react";
import WorkerDashboard from "@/components/WorkerDashboard";
import VacationRequestForm from "@/components/VacationRequestForm";
import MyRequestsList from "@/components/MyRequestsList";

type WorkerView = 'dashboard' | 'request' | 'my-requests' | 'profile';

export default function WorkerApp() {
  const [currentView, setCurrentView] = useState<WorkerView>('dashboard');

  // Mock data - todo: remove mock functionality
  const mockWorker = {
    name: "Andy Stouffer",
    joiningDate: new Date('1988-04-04'),
    yearsOfService: 37,
    weeksEntitled: 6,
    department: "Assembly Line A"
  };

  const mockRequests = [
    {
      id: '1',
      choice: 'first' as const,
      weeks: [12, 13, 14, 15, 16, 17],
      status: 'awarded_first' as const,
      submittedDate: new Date('2024-12-15'),
    },
    {
      id: '2',
      choice: 'second' as const,
      weeks: [26, 27, 28, 29, 30, 31],
      status: 'pending' as const,
      submittedDate: new Date('2024-12-15'),
    },
  ];

  const navItems = [
    { id: 'dashboard' as const, label: 'Home', icon: Home },
    { id: 'request' as const, label: 'New Request', icon: FileText },
    { id: 'my-requests' as const, label: 'My Requests', icon: Calendar },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {currentView === 'dashboard' && (
          <WorkerDashboard
            workerName={mockWorker.name}
            weeksEntitled={mockWorker.weeksEntitled}
            weeksRequested={6}
            weeksApproved={4}
            submissionDeadline={new Date('2025-01-10')}
            pendingRequests={2}
            approvedRequests={4}
          />
        )}
        
        {currentView === 'request' && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6">New Vacation Request</h1>
            <VacationRequestForm 
              availableWeeks={mockWorker.weeksEntitled}
              onSubmit={(first, second) => {
                console.log('Request submitted', { first, second });
                setCurrentView('my-requests');
              }}
            />
          </div>
        )}
        
        {currentView === 'my-requests' && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6">My Vacation Requests</h1>
            <MyRequestsList requests={mockRequests} />
          </div>
        )}
        
        {currentView === 'profile' && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6">My Profile</h1>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium text-foreground">{mockWorker.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Joining Date</p>
                <p className="text-lg font-medium text-foreground">
                  {mockWorker.joiningDate.toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Years of Service</p>
                <p className="text-lg font-medium text-foreground">{mockWorker.yearsOfService} years</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="text-lg font-medium text-foreground">{mockWorker.department}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Vacation Entitlement</p>
                <p className="text-lg font-medium text-primary">{mockWorker.weeksEntitled} weeks</p>
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
                    : 'text-muted-foreground hover-elevate'
                }`}
                data-testid={`nav-${item.id}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
