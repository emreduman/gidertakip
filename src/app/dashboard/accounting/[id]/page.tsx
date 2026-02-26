import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReviewActions } from "@/components/accounting/review-actions"
import { ReceiptViewer } from "@/components/accounting/receipt-viewer"
import { CalendarIcon, CreditCardIcon, MailIcon, PhoneIcon, AlertCircle, CheckCircle2, FileTextIcon } from "lucide-react"

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Masraf Formu <span className="text-slate-400">#{form.formNumber}</span>
                        </h1>
                        <Badge className={`${statusColors[form.status] || "bg-slate-100"} border-0 px-3 py-1 uppercase tracking-wider text-[10px] font-bold`}>
                            {form.status}
                        </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                            <span>Gönderim: {new Date(form.submittedAt).toLocaleDateString('tr-TR', { dateStyle: 'long' })}</span>
                        </div>
                        {form.processedAt && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-300 hidden sm:inline">•</span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span>İşlem: {new Date(form.processedAt).toLocaleDateString('tr-TR')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {form.status === 'SUBMITTED' && (
                    <div className="shrink-0">
                        <ReviewActions formId={form.id} />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Expenses (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <CreditCardIcon className="w-24 h-24 text-indigo-600" />
                            </div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Toplam Tutar</h3>
                            <div className="text-3xl font-bold text-slate-800 tracking-tight">
                                {Number(form.totalAmount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <FileTextIcon className="w-24 h-24 text-teal-600" />
                            </div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gider Kalemi</h3>
                            <div className="text-3xl font-bold text-slate-800 tracking-tight">
                                {form.expenses.length} <span className="text-lg text-slate-400 font-medium">Adet</span>
                            </div>
                        </div>
                    </div>

                    {/* Expenses List - Desktop Table / Mobile Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">Harcama Detayları</h3>
                        </div>
                        <div className="p-0">
                            {/* Mobile View */}
                            <div className="md:hidden divide-y divide-slate-100">
                                {form.expenses.map((expense: any) => (
                                    <div key={expense.id} className="p-5 flex gap-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="shrink-0">
                                            {expense.receiptUrl ? (
                                                <ReceiptViewer url={expense.receiptUrl} />
                                            ) : (
                                                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-medium text-slate-400 border border-slate-200">
                                                    Yok
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1.5">
                                                <div className="font-semibold text-sm text-slate-800 truncate pr-2">{expense.category || 'Diğer'}</div>
                                                <div className="font-bold text-sm text-slate-900 shrink-0 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100/50">
                                                    {Number(expense.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-500 break-words line-clamp-2 mb-2 leading-relaxed">{expense.description}</div>
                                            <div className="text-[11px] font-medium text-slate-400 bg-slate-100 w-fit px-2 py-1 rounded inline-flex items-center gap-1.5">
                                                <span>{expense.merchant}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span>{new Date(expense.date).toLocaleDateString('tr-TR')}</span>
                                            </div>
                                            {expense.warnings && (
                                                <Badge variant="outline" className="mt-2 border-amber-200 bg-amber-50 text-amber-700 text-[10px] px-2 py-1 h-auto inline-flex whitespace-normal text-left">
                                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mr-1.5 text-amber-500" /> {expense.warnings}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View */}
                            <Table className="hidden md:table">
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="w-[100px] text-xs font-bold text-slate-500 uppercase tracking-wider py-4 px-6">Fiş Görseli</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4">Kategori / Açıklama</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider py-4">Tarih & Tedarikçi</TableHead>
                                        <TableHead className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider py-4 px-6">Tutar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-slate-100">
                                    {form.expenses.map((expense: any) => (
                                        <TableRow key={expense.id} className="hover:bg-slate-50/50 transition-colors border-0">
                                            <TableCell className="align-top py-5 px-6">
                                                {expense.receiptUrl ? (
                                                    <ReceiptViewer url={expense.receiptUrl} />
                                                ) : (
                                                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-medium text-slate-400 border border-slate-200">
                                                        Yok
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="align-top py-5 max-w-[250px] xl:max-w-none">
                                                <div className="font-semibold text-sm text-slate-800">{expense.category || 'Diğer'}</div>
                                                <div className="text-sm text-slate-500 line-clamp-2 mt-1.5 break-words leading-relaxed">{expense.description}</div>
                                                {expense.warnings && (
                                                    <Badge variant="outline" className="mt-3 border-amber-200 bg-amber-50 text-amber-700 text-[10px] px-2 py-1 h-auto inline-flex gap-1.5 rounded-md">
                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> {expense.warnings}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="align-top whitespace-nowrap py-5">
                                                <div className="text-sm font-semibold text-slate-700">{expense.merchant}</div>
                                                <div className="text-xs font-medium text-slate-400 mt-1">{new Date(expense.date).toLocaleDateString('tr-TR')}</div>
                                            </TableCell>
                                            <TableCell className="text-right align-top py-5 px-6">
                                                <div className="inline-flex items-center gap-1.5 font-bold text-slate-900 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-md border border-emerald-100/50">
                                                    {Number(expense.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

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
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Kullanıcı Bilgileri</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-14 w-14 border-2 border-white shadow-md rounded-xl">
                                    <AvatarImage src={form.user.image || ''} className="rounded-xl" />
                                    <AvatarFallback className="rounded-xl bg-indigo-50 text-indigo-700 font-bold">{form.user.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-bold text-slate-900 text-lg">{form.user.name}</div>
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide mt-1">
                                        {form.user.role}
                                    </Badge>
                                </div>
                            </div>

                            <Separator className="bg-slate-100" />

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                        <MailIcon className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <span className="truncate font-medium" title={form.user.email || ''}>{form.user.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                        <PhoneIcon className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <span className="font-medium">{form.user.phone || 'Telefon yok'}</span>
                                </div>
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CreditCardIcon className="w-4 h-4 text-indigo-500" />
                                        <span className="font-bold text-xs text-slate-500 uppercase tracking-wider">Banka Bilgileri</span>
                                    </div>
                                    {/* Cast to any to access new fields for now if TS is stale */}
                                    <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                                        {(form.user as any).bankName && <p><span className="font-semibold text-slate-400 w-16 inline-block">Banka:</span> <span className="font-medium text-slate-800">{(form.user as any).bankName} {(form.user as any).bankBranch && `(${(form.user as any).bankBranch})`}</span></p>}
                                        {(form.user as any).accountHolder && <p><span className="font-semibold text-slate-400 w-16 inline-block">Sahibi:</span> <span className="font-medium text-slate-800">{(form.user as any).accountHolder}</span></p>}
                                        <p className="break-all pt-1 mt-1 border-t border-slate-200/50"><span className="font-semibold text-slate-400 block mb-1">IBAN:</span> <span className="font-mono bg-white px-2 py-1 rounded border border-slate-200/50 text-slate-800 font-medium">{form.user.iban || 'Girilmemiş'}</span></p>
                                        <p className="mt-2"><span className="font-semibold text-slate-400 w-16 inline-block">Birim:</span> <span className="font-bold text-slate-800">{(form.user as any).currency || 'TRY'}</span></p>
                                    </div>
                                </div>
                            </div>

                            {form.user.organization && (
                                <>
                                    <Separator className="bg-slate-100" />
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bağlı Organizasyon</div>
                                        <div className="font-bold text-slate-800 text-sm">{form.user.organization.name}</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Helpful Actions / Notes maybe? */}
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5">
                        <div className="text-sm text-indigo-900">
                            <p className="mb-3 font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                                Denetim İpuçları:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-xs font-medium text-indigo-800/80">
                                <li>Mali değeri olmayan fişleri kontrol edin (Bilgi Fişi vb).</li>
                                <li>Mükerrer harcama olup olmadığını inceleyin.</li>
                                <li>IBAN bilgisinin doğruluğunu teyit edin.</li>
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
