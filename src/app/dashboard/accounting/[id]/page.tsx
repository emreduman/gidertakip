import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReviewActions } from "@/components/accounting/review-actions"
import { ReceiptViewer } from "@/components/accounting/receipt-viewer"
import { CalendarIcon, CreditCardIcon, MailIcon, PhoneIcon, AlertCircle } from "lucide-react"

export default async function AccountingDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();
    const form = await prisma.expenseForm.findUnique({
        where: { id: params.id },
        include: {
            expenses: true,
            user: {
                include: {
                    organization: true
                }
            }
        }
    });

    if (!form) return <div>Form not found</div>;

    const statusColors: Record<string, string> = {
        PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        SUBMITTED: "bg-blue-100 text-blue-800 hover:bg-blue-100",
        APPROVED: "bg-green-100 text-green-800 hover:bg-green-100",
        REJECTED: "bg-red-100 text-red-800 hover:bg-red-100",
        PAID: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold tracking-tight">Masraf Formu #{form.formNumber}</h1>
                        <Badge className={`${statusColors[form.status] || "bg-gray-100"} border-0`}>
                            {form.status}
                        </Badge>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Gönderim: {new Date(form.submittedAt).toLocaleDateString('tr-TR', { dateStyle: 'long' })}</span>
                        {form.processedAt && (
                            <>
                                <span>•</span>
                                <span>İşlem: {new Date(form.processedAt).toLocaleDateString('tr-TR')}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {form.status === 'SUBMITTED' && (
                    <ReviewActions formId={form.id} />
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Expenses (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Tutar</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-primary">
                                    {Number(form.totalAmount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Gider Kalemi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{form.expenses.length} Adet</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Expenses List - Desktop Table / Mobile Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Harcama Detayları</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Mobile View */}
                            <div className="md:hidden divide-y">
                                {form.expenses.map((expense: any) => (
                                    <div key={expense.id} className="p-4 flex gap-4">
                                        <div className="shrink-0">
                                            {expense.receiptUrl ? (
                                                <ReceiptViewer url={expense.receiptUrl} />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                                                    Yok
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="font-medium text-sm truncate pr-2">{expense.category || 'Diğer'}</div>
                                                <div className="font-bold text-sm shrink-0">{Number(expense.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                                            </div>
                                            <div className="text-xs text-muted-foreground break-words line-clamp-2 mb-1">{expense.description}</div>
                                            <div className="text-xs text-gray-500">{expense.merchant} • {new Date(expense.date).toLocaleDateString('tr-TR')}</div>
                                            {expense.warnings && (
                                                <Badge variant="outline" className="mt-2 border-yellow-500 text-yellow-600 text-[10px] px-1 py-0 h-auto inline-flex whitespace-normal text-left">
                                                    <AlertCircle className="w-3 h-3 shrink-0 mr-1" /> {expense.warnings}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View */}
                            <Table className="hidden md:table">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Fiş</TableHead>
                                        <TableHead>Kategori / Açıklama</TableHead>
                                        <TableHead>Tarih & Tedarikçi</TableHead>
                                        <TableHead className="text-right">Tutar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {form.expenses.map((expense: any) => (
                                        <TableRow key={expense.id}>
                                            <TableCell className="align-top py-4">
                                                {expense.receiptUrl ? (
                                                    <ReceiptViewer url={expense.receiptUrl} />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                                                        Yok
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="align-top py-4 max-w-[200px] xl:max-w-none">
                                                <div className="font-medium text-sm">{expense.category || 'Diğer'}</div>
                                                <div className="text-sm text-muted-foreground line-clamp-2 mt-1 break-words">{expense.description}</div>
                                                {expense.warnings && (
                                                    <Badge variant="outline" className="mt-2 border-yellow-500 text-yellow-600 text-[10px] px-1 py-0 h-5 gap-1 inline-flex">
                                                        <AlertCircle className="w-3 h-3" /> {expense.warnings}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="align-top whitespace-nowrap py-4">
                                                <div className="text-sm font-medium">{expense.merchant}</div>
                                                <div className="text-xs text-muted-foreground mt-1">{new Date(expense.date).toLocaleDateString('tr-TR')}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium align-top py-4">
                                                {Number(expense.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Rejection Reason display if rejected */}
                    {form.status === 'REJECTED' && form.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex gap-3 text-red-800">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <div>
                                <h4 className="font-semibold text-sm">Red Sebebi</h4>
                                <p className="text-sm mt-1">{form.rejectionReason}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: User Info (1/3 width) */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kullanıcı Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarImage src={form.user.image || ''} />
                                    <AvatarFallback>{form.user.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold">{form.user.name}</div>
                                    <div className="text-xs text-muted-foreground">{form.user.role}</div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <MailIcon className="w-4 h-4 text-muted-foreground" />
                                    <span className="truncate" title={form.user.email || ''}>{form.user.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                                    <span>{form.user.phone || 'Telefon yok'}</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm">
                                        <CreditCardIcon className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-semibold text-xs">Banka Bilgileri</span>
                                    </div>
                                    {/* Cast to any to access new fields for now if TS is stale */}
                                    <div className="pl-6 text-xs text-muted-foreground space-y-1 bg-slate-50 p-2 rounded">
                                        {(form.user as any).bankName && <p><span className="font-medium">Banka:</span> {(form.user as any).bankName} {(form.user as any).bankBranch && `(${(form.user as any).bankBranch})`}</p>}
                                        {(form.user as any).accountHolder && <p><span className="font-medium">Sahibi:</span> {(form.user as any).accountHolder}</p>}
                                        <p className="font-mono break-all"><span className="font-medium">IBAN:</span> {form.user.iban || 'Girilmemiş'}</p>
                                        <p><span className="font-medium">Para Birimi:</span> {(form.user as any).currency || 'TRY'}</p>
                                    </div>
                                </div>
                            </div>

                            {form.user.organization && (
                                <>
                                    <Separator />
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Organizasyon</div>
                                        <div className="font-medium text-sm">{form.user.organization.name}</div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Helpful Actions / Notes maybe? */}
                    <Card className="bg-blue-50/50 border-blue-100 shadow-none">
                        <CardContent className="p-4">
                            <div className="text-sm text-blue-800">
                                <p className="mb-2"><strong>Denetim İpuçları:</strong></p>
                                <ul className="list-disc pl-4 space-y-1 text-xs">
                                    <li>Mali değeri olmayan fişleri kontrol edin (Bilgi Fişi vb).</li>
                                    <li>Mükerrer harcama olup olmadığını inceleyin.</li>
                                    <li>IBAN bilgisinin doğruluğunu teyit edin.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    )
}
