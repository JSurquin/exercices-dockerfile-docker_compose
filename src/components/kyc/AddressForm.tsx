'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
        <CardTitle>Adresse de résidence</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="country">Pays</Label>
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
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="postalCode">Code postal</Label>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="streetName">Rue</Label>
            <Input
              id="streetName"
              value={formData.streetName}
              onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="buildingNumber">Numéro</Label>
            <Input
              id="buildingNumber"
              value={formData.buildingNumber}
              onChange={(e) => setFormData({ ...formData, buildingNumber: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="unitNumber">Apt/Étage (optionnel)</Label>
            <Input
              id="unitNumber"
              value={formData.unitNumber}
              onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Enregistrement...' : 'Enregistrer l\'adresse'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
