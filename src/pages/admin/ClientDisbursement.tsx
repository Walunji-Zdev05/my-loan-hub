import { useState } from 'react';
import { Check, AlertCircle, Eye, DollarSign, Send } from 'lucide-react';

import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { loanApplications, clients, LoanApplication } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function ClientDisbursement() {
  const [applications, setApplications] = useState(
    loanApplications.filter(a => a.status === 'approved')
  );
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-MW', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(amount);

  const getClientDetails = (clientId: string) =>
    clients.find(c => c.id === clientId);

  const handleConfirmApprovalFee = (appId: string) => {
    setApplications(prev =>
      prev.map(a =>
        a.id === appId
          ? { ...a, approvalFeePaid: true, approvalFeePaidDate: new Date().toISOString().split('T')[0] }
          : a
      )
    );
    toast({
      title: 'Approval Fee Confirmed',
      description: 'The approval fee payment has been recorded',
    });
  };

  const handleDisburse = (appId: string) => {
    setApplications(prev => prev.filter(a => a.id !== appId));
    setShowDetails(false);
    setSelectedApp(null);
    toast({
      title: 'Loan Disbursed',
      description: 'The loan has been successfully disbursed to the client',
    });
  };

  const totalPendingDisbursement = applications.reduce((sum, a) => sum + a.amount, 0);

  const columns = [
    {
      key: 'id',
      header: 'Application ID',
      cell: (app: LoanApplication) => <span className="font-medium">{app.id}</span>,
    },
    {
      key: 'client',
      header: 'Client',
      cell: (app: LoanApplication) => (
        <div>
          <p className="font-medium">{app.clientName}</p>
          <p className="text-sm text-muted-foreground">NID: {app.nationalId}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Loan Amount',
      cell: (app: LoanApplication) => (
        <div>
          <p className="font-medium">{formatCurrency(app.amount)}</p>
          <p className="text-sm text-muted-foreground">{app.product}</p>
        </div>
      ),
    },
    {
      key: 'term',
      header: 'Term',
      cell: (app: LoanApplication) => `${app.term} ${app.termUnit}`,
    },
    {
      key: 'approvalFee',
      header: 'Approval Fee',
      cell: (app: LoanApplication) => (
        <div className={cn(
          'flex items-center gap-2 text-sm',
          app.approvalFeePaid ? 'text-success' : 'text-warning'
        )}>
          {app.approvalFeePaid ? (
            <>
              <Check className="h-4 w-4" />
              <span>Paid</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>Pending</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (app: LoanApplication) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedApp(app);
              setShowDetails(true);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {!app.approvalFeePaid && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleConfirmApprovalFee(app.id)}
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Confirm Fee
            </Button>
          )}
          {app.approvalFeePaid && (
            <Button
              size="sm"
              onClick={() => handleDisburse(app.id)}
            >
              <Send className="h-4 w-4 mr-1" />
              Disburse
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Client Disbursement</h1>
        <p className="mt-1 text-muted-foreground">
          Confirm approval fees and disburse approved loans
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Disbursement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{applications.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPendingDisbursement)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ready to Disburse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              {applications.filter(a => a.approvalFeePaid).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <DataTable
        columns={columns}
        data={applications}
        emptyMessage="No approved loans pending disbursement"
      />

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Disbursement Details</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              {/* Client Info */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <h4 className="font-medium">Client Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{selectedApp.clientName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">National ID:</span>
                    <p className="font-medium">{selectedApp.nationalId}</p>
                  </div>
                  {(() => {
                    const client = getClientDetails(selectedApp.clientId);
                    return client ? (
                      <>
                        <div>
                          <span className="text-muted-foreground">Phone:</span>
                          <p className="font-medium">{client.phone}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <p className="font-medium">{client.email}</p>
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>

              {/* Loan Details */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <h4 className="font-medium">Loan Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Product:</span>
                    <p className="font-medium">{selectedApp.product}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <p className="font-medium">{formatCurrency(selectedApp.amount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Term:</span>
                    <p className="font-medium">{selectedApp.term} {selectedApp.termUnit}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Purpose:</span>
                    <p className="font-medium">{selectedApp.purpose}</p>
                  </div>
                </div>
              </div>

              {/* Fee Statuses */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-success" />
                    <span className="text-success">Application Fee: {formatCurrency(selectedApp.applicationFeeAmount)}</span>
                  </div>
                  {selectedApp.applicationFeePaidDate && (
                    <span className="text-sm text-muted-foreground">
                      Paid: {formatDate(selectedApp.applicationFeePaidDate)}
                    </span>
                  )}
                </div>
                
                <div className={cn(
                  'flex items-center justify-between p-3 rounded-lg',
                  selectedApp.approvalFeePaid ? 'bg-success/10' : 'bg-warning/10'
                )}>
                  <div className="flex items-center gap-2">
                    {selectedApp.approvalFeePaid ? (
                      <Check className="h-5 w-5 text-success" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-warning" />
                    )}
                    <span className={selectedApp.approvalFeePaid ? 'text-success' : 'text-warning'}>
                      Approval Fee: {formatCurrency(selectedApp.approvalFeeAmount)}
                    </span>
                  </div>
                  {selectedApp.approvalFeePaid && selectedApp.approvalFeePaidDate && (
                    <span className="text-sm text-muted-foreground">
                      Paid: {formatDate(selectedApp.approvalFeePaidDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedApp && !selectedApp.approvalFeePaid && (
              <Button
                variant="outline"
                onClick={() => {
                  handleConfirmApprovalFee(selectedApp.id);
                  setSelectedApp({ ...selectedApp, approvalFeePaid: true, approvalFeePaidDate: new Date().toISOString().split('T')[0] });
                }}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Confirm Fee Payment
              </Button>
            )}
            <Button
              disabled={!selectedApp?.approvalFeePaid}
              onClick={() => selectedApp && handleDisburse(selectedApp.id)}
            >
              <Send className="h-4 w-4 mr-1" />
              Disburse Loan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
