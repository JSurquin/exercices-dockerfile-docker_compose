'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockTrades, mockUser, mockStats, mockVolumeData } from '@/lib/mock-data';
import {
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import CountUp from 'react-countup';

const formatPrice = (centimes: number) => {
  return (centimes / 100).toFixed(2) + '€';
};

const getStatusColor = (status: string) => {
  const colors = {
    'créé': 'bg-blue-500',
    'accepté_par_bot': 'bg-indigo-500',
    'en_trade_hold': 'bg-yellow-500',
    'disponible': 'bg-green-500',
    'paiement_en_cours': 'bg-orange-500',
    'payé': 'bg-emerald-500',
    'échoué': 'bg-red-500',
    'pending': 'bg-yellow-500',
    'verified': 'bg-green-500',
    'rejected': 'bg-red-500',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-500';
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'verified':
      return <CheckCircleIcon className="w-4 h-4" />;
    case 'pending':
    case 'in_progress':
      return <ClockIcon className="w-4 h-4" />;
    case 'rejected':
    case 'échoué':
      return <ExclamationTriangleIcon className="w-4 h-4" />;
    default:
      return null;
  }
};

// Mock data pour l'admin
const mockUsers = [
  {
    id: '1',
    steamId64: '76561198012345678',
    username: 'ProGamer2024',
    avatar: 'https://avatars.steamstatic.com/c5d56249ee5d28a07db4ac9f7f60af961fab5426_full.jpg',
    email: 'progamer@example.com',
    kycStatus: 'verified',
    totalVolume: 123456,
    trades: 12,
    createdAt: '2024-01-15',
    lastLogin: '2024-09-20',
  },
  {
    id: '2',
    steamId64: '76561198087654321',
    username: 'SkinMaster',
    avatar: 'https://avatars.steamstatic.com/185f21c3f1e8e55b1ff2f5dc1e8d3d2f5c6e7f8a_full.jpg',
    email: 'skinmaster@example.com',
    kycStatus: 'pending',
    totalVolume: 98765,
    trades: 8,
    createdAt: '2024-02-20',
    lastLogin: '2024-09-19',
  },
  {
    id: '3',
    steamId64: '76561198055555555',
    username: 'CSGOKing',
    avatar: 'https://avatars.steamstatic.com/8f3d5c1e9a2b4f6d8e7c9a1b2f4e6d8c7a9b1e2f_full.jpg',
    email: 'csgoking@example.com',
    kycStatus: 'verified',
    totalVolume: 215600,
    trades: 24,
    createdAt: '2024-01-10',
    lastLogin: '2024-09-21',
  },
];

const mockPayouts = [
  {
    id: 'payout_001',
    userId: '1',
    username: 'ProGamer2024',
    amount: 158693,
    method: 'SEPA',
    status: 'payé',
    createdAt: '2024-09-20',
    executedAt: '2024-09-20',
  },
  {
    id: 'payout_002',
    userId: '2',
    username: 'SkinMaster',
    amount: 95000,
    method: 'Bitcoin',
    status: 'paiement_en_cours',
    createdAt: '2024-09-19',
    executedAt: null,
  },
];

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Check admin access (simplified)
  const isAdmin = mockUser.steamId64 === '76561198012345678'; // Mock admin check

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Accès refusé</h2>
            <p className="text-muted-foreground mb-6">
              Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Retour à l&apos;accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const exportData = (type: string) => {
    // Simulation d'export
    const data = {
      users: mockUsers,
      trades: mockTrades,
      payouts: mockPayouts,
    };
    
    const filename = `cashtrade_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
    console.log(`Exporting ${type} to ${filename}`, data[type as keyof typeof data]);
    
    // Dans une vraie app, on générerait et téléchargerait le CSV
    alert(`Export ${type} généré: ${filename}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Administration CashTrade</h1>
              <p className="text-muted-foreground">Gestion et supervision de la plateforme</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => exportData('users')}>
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                Export Utilisateurs
              </Button>
              <Button variant="outline" onClick={() => exportData('trades')}>
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                Export Trades
              </Button>
              <Button variant="outline" onClick={() => exportData('payouts')}>
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                Export Paiements
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Utilisateurs totaux</p>
                  <p className="text-2xl font-bold">
                    <CountUp end={mockStats.totalUsers} duration={2} />
                  </p>
                  <p className="text-sm text-green-600">+12% ce mois</p>
                </div>
                <UsersIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Volume total</p>
                  <p className="text-2xl font-bold">
                    <CountUp end={mockStats.totalVolume / 100} duration={2} decimals={0} suffix="€" />
                  </p>
                  <p className="text-sm text-green-600">+8% ce mois</p>
                </div>
                <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Trades totaux</p>
                  <p className="text-2xl font-bold">
                    <CountUp end={mockStats.totalTrades} duration={2} />
                  </p>
                  <p className="text-sm text-green-600">+15% ce mois</p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenus (frais)</p>
                  <p className="text-2xl font-bold">
                    <CountUp end={mockStats.totalCommissions / 100} duration={2} decimals={0} suffix="€" />
                  </p>
                  <p className="text-sm text-green-600">+22% ce mois</p>
                </div>
                <CurrencyDollarIcon className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Analytics Charts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid lg:grid-cols-2 gap-6 mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Volume de trading</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatPrice(value as number), 'Volume']} />
                  <Line 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    dot={{ fill: '#f97316' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nouveaux utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="volume" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Management Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="users">Utilisateurs</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
              <TabsTrigger value="payouts">Paiements</TabsTrigger>
              <TabsTrigger value="kyc">KYC</TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Gestion des utilisateurs</CardTitle>
                    <div className="flex space-x-2">
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher un utilisateur..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="verified">Vérifié</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>KYC</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Trades</TableHead>
                        <TableHead>Dernière connexion</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={user.avatar} alt={user.username} />
                                <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.username}</p>
                                <p className="text-xs text-muted-foreground">{user.steamId64}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={`${getStatusColor(user.kycStatus)} text-white`}
                            >
                              <span className="flex items-center space-x-1">
                                {getStatusIcon(user.kycStatus)}
                                <span>{user.kycStatus === 'verified' ? 'Vérifié' : user.kycStatus === 'pending' ? 'En attente' : 'Rejeté'}</span>
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>{formatPrice(user.totalVolume)}</TableCell>
                          <TableCell>{user.trades}</TableCell>
                          <TableCell>{new Date(user.lastLogin).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <EyeIcon className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <PencilIcon className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600">
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trades Tab */}
            <TabsContent value="trades">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockTrades.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell className="font-mono text-sm">{trade.ticketId}</TableCell>
                          <TableCell>{trade.userId}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={`${getStatusColor(trade.status)} text-white`}
                            >
                              {trade.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{trade.items.length}</TableCell>
                          <TableCell>{formatPrice(trade.netCentimes)}</TableCell>
                          <TableCell>{new Date(trade.créédLe).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <EyeIcon className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <PencilIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payouts Tab */}
            <TabsContent value="payouts">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des paiements</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockPayouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell className="font-mono text-sm">{payout.id}</TableCell>
                          <TableCell>{payout.username}</TableCell>
                          <TableCell className="font-semibold">{formatPrice(payout.amount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payout.method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={`${getStatusColor(payout.status)} text-white`}
                            >
                              {payout.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(payout.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <EyeIcon className="w-4 h-4" />
                              </Button>
                              {payout.status === 'paiement_en_cours' && (
                                <Button variant="ghost" size="sm" className="text-green-600">
                                  <CheckCircleIcon className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* KYC Tab */}
            <TabsContent value="kyc">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion KYC</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-yellow-600">5</p>
                          <p className="text-sm text-muted-foreground">En attente</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-green-600">142</p>
                          <p className="text-sm text-muted-foreground">Vérifiés</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-red-600">3</p>
                          <p className="text-sm text-muted-foreground">Rejetés</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Utilisateur</TableHead>
                          <TableHead>Documents</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date de soumission</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockUsers.filter(u => u.kycStatus === 'pending').map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={user.avatar} alt={user.username} />
                                  <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.username}</p>
                                  <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-x-1">
                                <Badge variant="outline" className="text-xs">ID</Badge>
                                <Badge variant="outline" className="text-xs">Selfie</Badge>
                                <Badge variant="outline" className="text-xs">Adresse</Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-yellow-500 text-white">
                                En attente
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm">
                                  <EyeIcon className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-green-600">
                                  <CheckCircleIcon className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600">
                                  <XCircleIcon className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
