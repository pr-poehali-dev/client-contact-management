import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const API_URL = 'https://functions.poehali.dev/f5c8850f-b77f-4843-a3d0-08e1451f3609';

interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: number;
  clientId: number;
  contactPerson: string;
  position: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  createdAt: string;
}

interface Interaction {
  id: number;
  clientId: number;
  clientName: string;
  interactionType: string;
  description: string;
  interactionDate: string;
  createdBy: string;
}

interface Stats {
  totalClients: number;
  newClients: number;
  clientsWithEmail: number;
  totalInteractions: number;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const [newClient, setNewClient] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: ''
  });

  const [newInteraction, setNewInteraction] = useState({
    clientId: 0,
    interactionType: '',
    description: '',
    createdBy: 'Пользователь'
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}?entity=clients&action=stats`);
      return response.json();
    }
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients', searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `${API_URL}?entity=clients&search=${encodeURIComponent(searchQuery)}`
        : `${API_URL}?entity=clients`;
      const response = await fetch(url);
      return response.json();
    }
  });

  const { data: interactions = [] } = useQuery<Interaction[]>({
    queryKey: ['interactions'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}?entity=interactions`);
      return response.json();
    }
  });

  const createClientMutation = useMutation({
    mutationFn: async (client: typeof newClient) => {
      const response = await fetch(`${API_URL}?entity=clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setIsClientDialogOpen(false);
      setNewClient({ name: '', company: '', email: '', phone: '', address: '' });
      toast.success('Клиент успешно добавлен');
    }
  });

  const createInteractionMutation = useMutation({
    mutationFn: async (interaction: typeof newInteraction) => {
      const response = await fetch(`${API_URL}?entity=interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interaction)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setIsInteractionDialogOpen(false);
      setNewInteraction({ clientId: 0, interactionType: '', description: '', createdBy: 'Пользователь' });
      toast.success('Взаимодействие записано');
    }
  });

  const handleCreateClient = () => {
    createClientMutation.mutate(newClient);
  };

  const handleCreateInteraction = () => {
    createInteractionMutation.mutate(newInteraction);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Icon name="Users" className="text-primary-foreground" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">CRM Система</h1>
                <p className="text-sm text-muted-foreground">Управление клиентами и контактами</p>
              </div>
            </div>
            <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Icon name="Plus" size={18} />
                  Новый клиент
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Добавить клиента</DialogTitle>
                  <DialogDescription>
                    Заполните информацию о новом клиенте
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Имя</Label>
                    <Input
                      id="name"
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      placeholder="Иван Петров"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company">Компания</Label>
                    <Input
                      id="company"
                      value={newClient.company}
                      onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                      placeholder="ООО Технологии"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      placeholder="ivan@tech.ru"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      placeholder="+7 (495) 123-45-67"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Адрес</Label>
                    <Input
                      id="address"
                      value={newClient.address}
                      onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                      placeholder="Москва, ул. Ленина, 10"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsClientDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleCreateClient}>
                    Создать
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="dashboard" className="gap-2">
              <Icon name="LayoutDashboard" size={16} />
              Дашборд
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Icon name="Users" size={16} />
              Клиенты
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Icon name="History" size={16} />
              История
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="hover-scale">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего клиентов</CardTitle>
                  <Icon name="Users" className="text-muted-foreground" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalClients || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    База данных клиентов
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Новых за месяц</CardTitle>
                  <Icon name="TrendingUp" className="text-muted-foreground" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.newClients || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Последние 30 дней
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">С email</CardTitle>
                  <Icon name="Mail" className="text-muted-foreground" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.clientsWithEmail || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Для рассылок
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Взаимодействий</CardTitle>
                  <Icon name="Activity" className="text-muted-foreground" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalInteractions || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    За последний месяц
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Последние взаимодействия</CardTitle>
                <CardDescription>История контактов с клиентами</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interactions.slice(0, 5).map((interaction) => (
                    <div key={interaction.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon 
                          name={
                            interaction.interactionType === 'Звонок' ? 'Phone' :
                            interaction.interactionType === 'Email' ? 'Mail' :
                            interaction.interactionType === 'Встреча' ? 'Calendar' :
                            'MessageSquare'
                          }
                          className="text-primary"
                          size={18}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{interaction.clientName}</p>
                          <Badge variant="outline">{interaction.interactionType}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{interaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(interaction.interactionDate).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {interactions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Пока нет записей о взаимодействиях
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Клиенты</CardTitle>
                    <CardDescription>Управление базой клиентов</CardDescription>
                  </div>
                  <div className="relative w-80">
                    <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      placeholder="Поиск по имени, компании или email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Имя</TableHead>
                      <TableHead>Компания</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Телефон</TableHead>
                      <TableHead>Адрес</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-accent/50">
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.company || '—'}</TableCell>
                        <TableCell>{client.email || '—'}</TableCell>
                        <TableCell>{client.phone || '—'}</TableCell>
                        <TableCell className="max-w-xs truncate">{client.address || '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Icon name="Eye" size={16} />
                            Просмотр
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {clients.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery ? 'Клиенты не найдены' : 'Нет клиентов. Добавьте первого клиента'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>История взаимодействий</CardTitle>
                    <CardDescription>Все контакты с клиентами</CardDescription>
                  </div>
                  <Dialog open={isInteractionDialogOpen} onOpenChange={setIsInteractionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Icon name="Plus" size={18} />
                        Добавить запись
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px]">
                      <DialogHeader>
                        <DialogTitle>Новое взаимодействие</DialogTitle>
                        <DialogDescription>
                          Запись о контакте с клиентом
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="client">Клиент</Label>
                          <Select
                            value={newInteraction.clientId.toString()}
                            onValueChange={(value) => setNewInteraction({ ...newInteraction, clientId: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите клиента" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.name} — {client.company}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="type">Тип взаимодействия</Label>
                          <Select
                            value={newInteraction.interactionType}
                            onValueChange={(value) => setNewInteraction({ ...newInteraction, interactionType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите тип" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Звонок">Звонок</SelectItem>
                              <SelectItem value="Email">Email</SelectItem>
                              <SelectItem value="Встреча">Встреча</SelectItem>
                              <SelectItem value="Сообщение">Сообщение</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Описание</Label>
                          <Textarea
                            id="description"
                            value={newInteraction.description}
                            onChange={(e) => setNewInteraction({ ...newInteraction, description: e.target.value })}
                            placeholder="Обсудили условия сотрудничества..."
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInteractionDialogOpen(false)}>
                          Отмена
                        </Button>
                        <Button onClick={handleCreateInteraction}>
                          Сохранить
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Описание</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Автор</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interactions.map((interaction) => (
                      <TableRow key={interaction.id}>
                        <TableCell className="font-medium">{interaction.clientName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{interaction.interactionType}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">{interaction.description}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(interaction.interactionDate).toLocaleString('ru-RU')}
                        </TableCell>
                        <TableCell>{interaction.createdBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {interactions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    Нет записей о взаимодействиях
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
