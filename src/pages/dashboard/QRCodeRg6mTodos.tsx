import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ArrowLeft, Loader2, User, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import SimpleTitleBar from '@/components/dashboard/SimpleTitleBar';
import ScrollToTop from '@/components/ui/scroll-to-top';

const PHP_API_BASE = 'https://qr.atito.com.br/qrcode';
const PHP_VALIDATION_BASE = 'https://qr.atito.com.br/qrvalidation';
const ITEMS_PER_PAGE = 20;

interface RegistroData {
  id: number;
  token: string;
  full_name: string;
  birth_date: string;
  document_number: string;
  parent1: string;
  parent2: string;
  photo_path: string;
  validation: 'pending' | 'verified';
  expiry_date: string;
  is_expired: boolean;
  qr_code_path: string;
  id_user: string | null;
  created_at: string;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
};

const formatFullDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const QRCodeRg6mTodos = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [registrations, setRegistrations] = useState<RegistroData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const loadRegistrations = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const response = await fetch(`${PHP_API_BASE}/list_users.php?limit=${ITEMS_PER_PAGE}&offset=${offset}`);
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setRegistrations(data.data);
        setTotal(data.pagination?.total || data.data.length);
      } else {
        setRegistrations([]);
      }
    } catch (error) {
      console.error('Erro ao carregar cadastros:', error);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistrations(currentPage);
  }, [currentPage, loadRegistrations]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = isMobile ? 3 : 7;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6 px-2 sm:px-0 pb-6">
      <ScrollToTop />
      <SimpleTitleBar title="Todos os Cadastros - QR Code RG" onBack={() => navigate('/dashboard/qrcode-rg-6m')} />

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/qrcode-rg-6m')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <Button variant="outline" size="sm" onClick={() => loadRegistrations(currentPage)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">
          {total} cadastro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </span>
      </div>

      <Card className="w-full">
        <CardContent className="p-0 sm:p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Carregando cadastros...</span>
            </div>
          ) : registrations.length > 0 ? (
            <>
              {isMobile ? (
                <div className="space-y-2 p-2">
                  {registrations.map((reg) => (
                    <div key={reg.id} className="rounded-md border border-border bg-card p-3 space-y-2">
                      <div className="flex items-start gap-3">
                        {reg.photo_path ? (
                          <img
                            src={`${PHP_VALIDATION_BASE}/${reg.photo_path}`}
                            alt="Foto"
                            className="w-14 h-14 object-cover rounded flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-14 h-14 bg-muted rounded flex items-center justify-center flex-shrink-0">
                            <User className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{reg.full_name}</div>
                          <div className="font-mono text-xs text-muted-foreground">{reg.document_number}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{formatFullDate(reg.created_at)}</div>
                        </div>
                        <Badge
                          variant={reg.validation === 'verified' ? 'secondary' : 'outline'}
                          className={
                            reg.validation === 'verified'
                              ? 'text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          }
                        >
                          {reg.validation === 'verified' ? 'Verificado' : 'Pendente'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        <div><span className="font-medium">Nasc:</span> {formatDate(reg.birth_date)}</div>
                        <div><span className="font-medium">Validade:</span> <span className={reg.is_expired ? 'text-red-500 font-medium' : ''}>{formatDate(reg.expiry_date)} {reg.is_expired && '(Exp.)'}</span></div>
                        <div><span className="font-medium">Pai:</span> {reg.parent1 || '-'}</div>
                        <div><span className="font-medium">Mãe:</span> {reg.parent2 || '-'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://qr.atito.com.br/qrvalidation/?token=${reg.token}&ref=${reg.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline"
                        >
                          Visualizar QR
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Foto</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-36">Documento</TableHead>
                      <TableHead className="w-28">Nascimento</TableHead>
                      <TableHead>Pai</TableHead>
                      <TableHead>Mãe</TableHead>
                      <TableHead className="w-40">Cadastro</TableHead>
                      <TableHead className="w-28">Validade</TableHead>
                      <TableHead className="w-24 text-center">Status</TableHead>
                      <TableHead className="w-24 text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell>
                          {reg.photo_path ? (
                            <img
                              src={`${PHP_VALIDATION_BASE}/${reg.photo_path}`}
                              alt="Foto"
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-sm">{reg.full_name}</TableCell>
                        <TableCell className="font-mono text-xs">{reg.document_number}</TableCell>
                        <TableCell className="text-xs">{formatDate(reg.birth_date)}</TableCell>
                        <TableCell className="text-xs">{reg.parent1 || '-'}</TableCell>
                        <TableCell className="text-xs">{reg.parent2 || '-'}</TableCell>
                        <TableCell className="text-xs">{formatFullDate(reg.created_at)}</TableCell>
                        <TableCell className="text-xs">
                          <span className={reg.is_expired ? 'text-red-500 font-medium' : ''}>
                            {formatDate(reg.expiry_date)}
                            {reg.is_expired && ' (Exp.)'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={reg.validation === 'verified' ? 'secondary' : 'outline'}
                            className={
                              reg.validation === 'verified'
                                ? 'text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            }
                          >
                            {reg.validation === 'verified' ? 'Verificado' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <a
                            href={`https://qr.atito.com.br/qrvalidation/?token=${reg.token}&ref=${reg.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary underline"
                          >
                            Visualizar
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 py-4 px-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className="min-w-[36px]"
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum cadastro encontrado</h3>
              <p className="text-sm">Seus cadastros realizados aparecerão aqui</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeRg6mTodos;
