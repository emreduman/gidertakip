"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getBotIntegrationsAction, saveBotIntegrationAction, deleteBotIntegrationAction } from "@/actions/bot-integrations";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit, Bot } from "lucide-react";

export default function BotIntegrationSettings() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Need to fetch users so admin can pick who gets the bot integration
  const [users, setUsers] = useState<any[]>([]);

  const defaultForm = {
    id: undefined,
    userId: "",
    platform: "TELEGRAM",
    chatId: "",
    isActive: true,
    canReadExpenses: true,
    canWriteExpenses: false,
    canReadBudget: true,
    canReadReports: false,
    customPrompt: ""
  };

  const [form, setForm] = useState<any>(defaultForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getBotIntegrationsAction();
      if (res.success) {
        setIntegrations(res.integrations || []);
      } else {
        toast.error("Hata", { description: res.error });
      }

      // Fetch users for the dropdown (in a real app, this should be a dedicated admin action or combobox)
      // For now we'll fetch them from an existing API or just rely on a simple text input if API isn't ready.
      // Since I don't have a direct "get all users" action available in this scope, I'll let the admin type the user ID
      // or we can fetch them via a generic action if we build one. Let's make it a text input for User ID for now, 
      // or ideally we'd have a User select. I will leave it as a text input for the `userId` for simplicity in this prototype.
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.userId || !form.chatId) {
      toast.error("Hata", { description: "Kullanıcı ID ve Chat ID zorunludur." });
      return;
    }
    
    setSaving(true);
    try {
      const res = await saveBotIntegrationAction(form);
      if (res.success) {
        toast.success("Başarılı", { description: "Bot entegrasyonu kaydedildi." });
        setForm(defaultForm);
        setIsEditing(false);
        loadData();
      } else {
        toast.error("Hata", { description: res.error });
      }
    } catch (error) {
      toast.error("Hata", { description: "Kaydedilemedi." });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (integration: any) => {
    setForm({
      id: integration.id,
      userId: integration.userId,
      platform: integration.platform,
      chatId: integration.chatId || "",
      isActive: integration.isActive,
      canReadExpenses: integration.canReadExpenses,
      canWriteExpenses: integration.canWriteExpenses,
      canReadBudget: integration.canReadBudget,
      canReadReports: integration.canReadReports,
      customPrompt: integration.customPrompt || ""
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu entegrasyonu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await deleteBotIntegrationAction(id);
      if (res.success) {
        toast.success("Silindi", { description: "Entegrasyon kaldırıldı." });
        loadData();
      } else {
        toast.error("Hata", { description: res.error });
      }
    } catch (e) {
      toast.error("Hata", { description: "Silinemedi." });
    }
  };

  if (loading) return <div className="py-10 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      {isEditing || integrations.length === 0 ? (
        <Card className="border-indigo-100 shadow-md">
          <CardHeader className="bg-indigo-50/50 border-b border-indigo-50 pb-4">
            <CardTitle className="text-indigo-900 flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-600" />
              {form.id ? 'Bağlantıyı Düzenle' : 'Yeni Bot Bağlantısı Oluştur'}
            </CardTitle>
            <CardDescription>
              Kullanıcıya özel bot erişim izinlerini ve kişiliğini yapılandırın.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kullanıcı ID <span className="text-red-500">*</span></Label>
                <Input 
                  value={form.userId} 
                  onChange={(e) => setForm({...form, userId: e.target.value})} 
                  placeholder="Kullanıcının sistem veritabanı ID'si" 
                  disabled={!!form.id} // Don't allow changing user on edit
                />
              </div>
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({...form, platform: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TELEGRAM">Telegram</SelectItem>
                    <SelectItem value="OPENCLAW">OpenClaw</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="CUSTOM">Diğer / Özel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Platform Chat ID (veya Token) <span className="text-red-500">*</span></Label>
                <Input 
                  value={form.chatId} 
                  onChange={(e) => setForm({...form, chatId: e.target.value})} 
                  placeholder="Örn: 123456789" 
                />
              </div>
              <div className="space-y-2 flex items-center pt-8">
                <Switch 
                  id="isActive" 
                  checked={form.isActive} 
                  onCheckedChange={(c) => setForm({...form, isActive: c})} 
                />
                <Label htmlFor="isActive" className="ml-2">Bağlantı Aktif</Label>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Erişim İzinleri</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex items-center space-x-2">
                  <Switch id="readExp" checked={form.canReadExpenses} onCheckedChange={(c) => setForm({...form, canReadExpenses: c})} />
                  <Label htmlFor="readExp">Harcamaları Okuyabilir</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="writeExp" checked={form.canWriteExpenses} onCheckedChange={(c) => setForm({...form, canWriteExpenses: c})} />
                  <Label htmlFor="writeExp">Fiş/Harcama Yükleyebilir</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="readBud" checked={form.canReadBudget} onCheckedChange={(c) => setForm({...form, canReadBudget: c})} />
                  <Label htmlFor="readBud">Bütçe Durumunu Görebilir</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="readRep" checked={form.canReadReports} onCheckedChange={(c) => setForm({...form, canReadReports: c})} />
                  <Label htmlFor="readRep">Detaylı Rapor Alabilir</Label>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="space-y-2">
                <Label>Özel Bot Kişiliği (Prompt Injection)</Label>
                <Textarea 
                  value={form.customPrompt} 
                  onChange={(e) => setForm({...form, customPrompt: e.target.value})}
                  placeholder="Bu kullanıcı için bota özel bir ton veya rol belirleyin. Örn: 'Sen çok sert ve disiplinli bir finans müdürüsün...'"
                  className="min-h-[100px]"
                />
                <p className="text-xs text-slate-500">Boş bırakılırsa sistemin varsayılan asistan tonu kullanılır.</p>
              </div>
            </div>
            
          </CardContent>
          <CardFooter className="flex justify-between bg-slate-50/50 border-t border-slate-100 py-4">
            <Button variant="outline" onClick={() => { setForm(defaultForm); setIsEditing(false); }}>İptal</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {form.id ? 'Güncelle' : 'Kaydet'}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-semibold text-slate-800">Kayıtlı Bağlantılar</h3>
              <p className="text-sm text-slate-500">Sisteme tanımlı bot entegrasyonları</p>
            </div>
            <Button onClick={() => setIsEditing(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-1" /> Yeni Ekle
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((item) => (
              <Card key={item.id} className={`border-l-4 ${item.isActive ? 'border-l-emerald-500' : 'border-l-slate-300'}`}>
                <CardHeader className="py-3 px-4 pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base text-slate-800">{item.user?.name || item.user?.email || 'Bilinmeyen Kullanıcı'}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{item.platform}</span>
                        <span className="text-xs">ID: {item.chatId}</span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 py-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {item.canReadExpenses && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">Okuma</span>}
                    {item.canWriteExpenses && <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-100">Yazma</span>}
                    {item.canReadBudget && <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md border border-purple-100">Bütçe</span>}
                    {item.canReadReports && <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-100">Rapor</span>}
                  </div>
                  {item.customPrompt && (
                    <p className="mt-3 text-xs text-slate-500 italic line-clamp-2 border-l-2 border-slate-200 pl-2">
                      "{item.customPrompt}"
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
