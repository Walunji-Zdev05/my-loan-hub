import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CreditCard, Phone, Mail, ArrowLeft, Building, Briefcase, MapPin, DollarSign } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useCreateClient } from '@/hooks/useClients';

interface ClientFormData {
  first_name: string;
  last_name: string;
  id_number: string;
  phone: string;
  email: string;
  address: string;
  occupation: string;
  employer: string;
  monthly_income: string;
  notes: string;
}

export default function CreateClient() {
  const navigate = useNavigate();
  const createClient = useCreateClient();
  
  const [formData, setFormData] = useState<ClientFormData>({
    first_name: '',
    last_name: '',
    id_number: '',
    phone: '',
    email: '',
    address: '',
    occupation: '',
    employer: '',
    monthly_income: '',
    notes: '',
  });

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in at least first and last name',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createClient.mutateAsync({
        first_name: formData.first_name,
        last_name: formData.last_name,
        id_number: formData.id_number || null,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        occupation: formData.occupation || null,
        employer: formData.employer || null,
        monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : null,
        notes: formData.notes || null,
        status: 'pending',
      });
      
      toast({
        title: 'Client Created',
        description: `${formData.first_name} ${formData.last_name} has been registered and is pending approval`,
      });
      
      navigate('/admin/pending-clients');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create client',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate('/admin/clients')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Create New Client</h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Register a new client in the system
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="h-5 w-5" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="first_name"
                    placeholder="Enter first name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="pl-10 h-11 sm:h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="last_name"
                    placeholder="Enter last name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="pl-10 h-11 sm:h-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_number">National ID</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="id_number"
                  placeholder="Enter national ID"
                  value={formData.id_number}
                  onChange={(e) => handleInputChange('id_number', e.target.value)}
                  className="pl-10 h-11 sm:h-10"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+265..."
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10 h-11 sm:h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 h-11 sm:h-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  placeholder="Enter physical address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="pl-10 min-h-[80px]"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="occupation"
                    placeholder="Enter occupation"
                    value={formData.occupation}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                    className="pl-10 h-11 sm:h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employer">Employer</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="employer"
                    placeholder="Enter employer name"
                    value={formData.employer}
                    onChange={(e) => handleInputChange('employer', e.target.value)}
                    className="pl-10 h-11 sm:h-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_income">Monthly Income (K)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="monthly_income"
                  type="number"
                  placeholder="Enter monthly income"
                  value={formData.monthly_income}
                  onChange={(e) => handleInputChange('monthly_income', e.target.value)}
                  className="pl-10 h-11 sm:h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the client..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Button type="submit" disabled={createClient.isPending} className="h-11 sm:h-10 w-full sm:w-auto">
                {createClient.isPending ? 'Creating...' : 'Create Client'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/admin/clients')} className="h-11 sm:h-10 w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
