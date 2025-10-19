import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { clientsApi, contactsApi } from '@/lib/api';
import { Client, Contact } from '@/types/client';
import { ClientDialog } from '@/components/ClientDialog';
import { ContactDialog } from '@/components/ContactDialog';

const Index = () => {
  const [activeTab, setActiveTab] = useState('clients');
  const [searchQuery, setSearchQuery] = useState('');
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['clients', searchQuery],
    queryFn: () => clientsApi.getAll(searchQuery),
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['contacts', selectedClientId],
    queryFn: () => selectedClientId ? contactsApi.getAll(selectedClientId) : Promise.resolve([]),
    enabled: !!selectedClientId,
  });

  const createClientMutation = useMutation({
    mutationFn: (client: Partial<Client>) => clientsApi.create(client as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Клиент успешно добавлен');
    },
    onError: () => {
      toast.error('Ошибка при добавлении клиента');
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: (client: Partial<Client> & { id: number }) => clientsApi.update(client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Клиент обновлен');
    },
    onError: () => {
      toast.error('Ошибка при обновлении клиента');
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id: number) => clientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Клиент удален');
    },
    onError: () => {
      toast.error('Ошибка при удалении клиента');
    },
  });

  const createContactMutation = useMutation({
    mutationFn: (contact: Partial<Contact>) => contactsApi.create(contact as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Контакт добавлен');
    },
    onError: () => {
      toast.error('Ошибка при добавлении контакта');
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: (contact: Partial<Contact> & { id: number }) => contactsApi.update(contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Контакт обновлен');
    },
    onError: () => {
      toast.error('Ошибка при обновлении контакта');
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: number) => contactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Контакт удален');
    },
    onError: () => {
      toast.error('Ошибка при удалении контакта');
    },
  });

  const handleSaveClient = async (client: Partial<Client>) => {
    if (client.id) {
      await updateClientMutation.mutateAsync(client as any);
    } else {
      await createClientMutation.mutateAsync(client);
    }
  };

  const handleSaveContact = async (contact: Partial<Contact>) => {
    if (contact.id) {
      await updateContactMutation.mutateAsync(contact as any);
    } else {
      await createContactMutation.mutateAsync(contact);
    }
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsClientDialogOpen(true);
  };

  const handleDeleteClient = (id: number) => {
    if (confirm('Вы уверены, что хотите удалить клиента?')) {
      deleteClientMutation.mutate(id);
    }
  };

  const handleAddContact = (clientId: number) => {
    setSelectedClientId(clientId);
    setSelectedContact(null);
    setIsContactDialogOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsContactDialogOpen(true);
  };

  const handleDeleteContact = (id: number) => {
    if (confirm('Вы уверены, что хотите удалить контакт?')) {
      deleteContactMutation.mutate(id);
    }
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
                <h1 className="text-2xl font-semibold">Система учета клиентов</h1>
                <p className="text-sm text-muted-foreground">Управление клиентами и контактными данными</p>
              </div>
            </div>
            <Button 
              className="gap-2"
              onClick={() => {
                setSelectedClient(null);
                setIsClientDialogOpen(true);
              }}
            >
              <Icon name="Plus" size={18} />
              Новый клиент
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="clients" className="gap-2">
              <Icon name="Users" size={18} />
              Клиенты
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-2">
              <Icon name="Contact" size={18} />
              Контакты
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Список клиентов</CardTitle>
                    <CardDescription>Все клиенты компании</CardDescription>
                  </div>
                  <div className="w-80">
                    <Input
                      placeholder="Поиск по имени, компании или email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {clientsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
                ) : clients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет клиентов
                  </div>
                ) : (
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
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>{client.company || '—'}</TableCell>
                          <TableCell>{client.email || '—'}</TableCell>
                          <TableCell>{client.phone || '—'}</TableCell>
                          <TableCell className="max-w-xs truncate">{client.address || '—'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddContact(client.id)}
                              >
                                <Icon name="UserPlus" size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClient(client)}
                              >
                                <Icon name="Edit" size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClient(client.id)}
                              >
                                <Icon name="Trash2" size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>Контактные лица</CardTitle>
                <CardDescription>
                  {selectedClientId 
                    ? `Контакты клиента ${clients.find(c => c.id === selectedClientId)?.name}` 
                    : 'Выберите клиента в разделе "Клиенты" или добавьте контакт через кнопку +'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет контактных лиц
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Контактное лицо</TableHead>
                        <TableHead>Должность</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Телефон</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">{contact.contact_person}</TableCell>
                          <TableCell>{contact.position || '—'}</TableCell>
                          <TableCell>{contact.email || '—'}</TableCell>
                          <TableCell>{contact.phone || '—'}</TableCell>
                          <TableCell>
                            {contact.is_primary && <Badge variant="default">Основной</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditContact(contact)}
                              >
                                <Icon name="Edit" size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteContact(contact.id)}
                              >
                                <Icon name="Trash2" size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <ClientDialog
        open={isClientDialogOpen}
        onOpenChange={setIsClientDialogOpen}
        client={selectedClient}
        onSave={handleSaveClient}
      />

      {selectedClientId && (
        <ContactDialog
          open={isContactDialogOpen}
          onOpenChange={setIsContactDialogOpen}
          contact={selectedContact}
          clientId={selectedClientId}
          onSave={handleSaveContact}
        />
      )}
    </div>
  );
};

export default Index;
