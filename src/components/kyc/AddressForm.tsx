'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/components/providers/locale-provider';

interface AddressFormProps {
  onSubmit: (address: AddressData) => void;
  isLoading?: boolean;
}

export interface AddressData {
  country: string;
  city: string;
  postalCode: string;
  streetName: string;
  buildingNumber: string;
  unitNumber?: string;
}

export function AddressForm({ onSubmit, isLoading }: AddressFormProps) {
  const { messages } = useLocale();
  const m = messages.addressForm;
  const [formData, setFormData] = useState<AddressData>({
    country: 'FR',
    city: '',
    postalCode: '',
    streetName: '',
    buildingNumber: '',
    unitNumber: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="country">{m.country}</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="FR"
              maxLength={2}
              required
            />
          </div>

          <div>
            <Label htmlFor="city">{m.city}</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="postalCode">{m.postalCode}</Label>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="streetName">{m.street}</Label>
            <Input
              id="streetName"
              value={formData.streetName}
              onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="buildingNumber">{m.buildingNumber}</Label>
            <Input
              id="buildingNumber"
              value={formData.buildingNumber}
              onChange={(e) => setFormData({ ...formData, buildingNumber: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="unitNumber">{m.unitNumber}</Label>
            <Input
              id="unitNumber"
              value={formData.unitNumber}
              onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? m.saving : m.save}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
