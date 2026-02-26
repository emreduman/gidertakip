'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { updateAISettings, updateSMTPSettings, addRSSFeed, removeRSSFeed } from "@/actions/settings"
import { Loader2, Plus, Trash2 } from "lucide-react"
import FileManager from "./settings/file-manager";

export default function SettingsTabs({ settings, organizationId }: { settings: any, organizationId: string }) {
    const [activeTab, setActiveTab] = useState('files');
    const [loading, setLoading] = useState(false);

    // AI Forms State
    const [aiForm, setAiForm] = useState({
        openaiApiKey: settings?.openaiApiKey || '',
        geminiApiKey: settings?.geminiApiKey || '',
        openRouterApiKey: settings?.openRouterApiKey || '',
        openRouterModel: settings?.openRouterModel || 'google/gemini-2.0-flash-001'
    });

    // SMTP Forms State
    const [smtpForm, setSmtpForm] = useState({
        smtpHost: settings?.smtpHost || '',
        smtpPort: settings?.smtpPort || 587,
        smtpUser: settings?.smtpUser || '',
        smtpPassword: settings?.smtpPassword || '',
        smtpSecure: settings?.smtpSecure ?? true,
        smtpFromEmail: settings?.smtpFromEmail || ''
    });

    // RSS State
    const [rssUrl, setRssUrl] = useState('');
    const [rssName, setRssName] = useState('');
    const [rssList, setRssList] = useState(settings?.rssFeeds || []);

    const handleAiSave = async () => {
        setLoading(true);
        try {
            await updateAISettings(organizationId, aiForm);
            toast.success("Başarılı", { description: "Yapay zeka ayarları güncellendi." });
        } catch (error) {
            toast.error("Hata", { description: "Ayarlar güncellenirken bir sorun oluştu." });
        } finally {
            setLoading(false);
        }
    };

    const handleSmtpSave = async () => {
        setLoading(true);
        try {
            await updateSMTPSettings(organizationId, smtpForm);
            toast.success("Başarılı", { description: "E-posta sunucu ayarları güncellendi." });
        } catch (error) {
            toast.error("Hata", { description: "Ayarlar güncellenirken bir sorun oluştu." });
        } finally {
            setLoading(false);
        }
    };

    const handleAddRss = async () => {
        if (!rssName || !rssUrl) return;
        setLoading(true);
        try {
            await addRSSFeed(organizationId, { name: rssName, url: rssUrl });
            toast.success("Başarılı", { description: "RSS kaynağı eklendi. Sayfayı yenileyerek listeyi görebilirsiniz." });
            setRssName('');
            setRssUrl('');
        } catch (error) {
            toast.error("Hata", { description: "RSS eklenemedi." });
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveRss = async (id: string) => {
        if (!confirm('Bu kaynağı silmek istediğinize emin misiniz?')) return;
        try {
            await removeRSSFeed(id);
            toast.success("Silindi", { description: "RSS kaynağı kaldırıldı." });
            setRssList((prev: any[]) => prev.filter((item: any) => item.id !== id));
        } catch (e) {
            toast.error("Hata", { description: "Silinemedi." });
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
            {/* Custom Tabs Header */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg overflow-x-auto">
                {['files', 'ai', 'smtp', 'rss'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab
                            ? 'bg-background shadow text-foreground'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                    >
                        {tab === 'files' && '📂 Dosya Yöneticisi'}
                        {tab === 'ai' && '🤖 Yapay Zeka & Tokenlar'}
                        {tab === 'smtp' && '📧 E-posta & SMTP'}
                        {tab === 'rss' && '📰 Vergi & Mevzuat RSS'}
                    </button>
                ))}
            </div>

            {/* File Manager Tab */}
            {activeTab === 'files' && (
                <FileManager organizationId={organizationId} />
            )}

            {/* AI Settings Tab */}
            {activeTab === 'ai' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Yapay Zeka Entegrasyonları</CardTitle>
                        <CardDescription>
                            Uygulamanın fiş okuma ve analiz özelliklerini kullanabilmek için API anahtarlarınızı giriniz.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>OpenAI API Key (Opsiyonel)</Label>
                            <Input
                                type="password"
                                value={aiForm.openaiApiKey}
                                onChange={(e) => setAiForm({ ...aiForm, openaiApiKey: e.target.value })}
                                placeholder="sk-..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Google Gemini API Key (Opsiyonel)</Label>
                            <Input
                                type="password"
                                value={aiForm.geminiApiKey}
                                onChange={(e) => setAiForm({ ...aiForm, geminiApiKey: e.target.value })}
                                placeholder="AIza..."
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>OpenRouter API Key</Label>
                                <Input
                                    type="password"
                                    value={aiForm.openRouterApiKey}
                                    onChange={(e) => setAiForm({ ...aiForm, openRouterApiKey: e.target.value })}
                                    placeholder="sk-or-..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Varsayılan Model (OpenRouter)</Label>
                                <Select
                                    value={aiForm.openRouterModel}
                                    onValueChange={(val) => setAiForm({ ...aiForm, openRouterModel: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Model Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="google/gemini-2.0-flash-001">Gemini 2.0 Flash</SelectItem>
                                        <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
                                        <SelectItem value="anthropic/claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                                        <SelectItem value="meta-llama/llama-3-70b-instruct">Llama 3 70B</SelectItem>
                                        <SelectItem value="deepseek/deepseek-r1">DeepSeek R1</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleAiSave} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Kaydet
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* SMTP Settings Tab */}
            {activeTab === 'smtp' && (
                <Card>
                    <CardHeader>
                        <CardTitle>SMTP E-posta Yapılandırması</CardTitle>
                        <CardDescription>
                            Otomatik bildirimler ve raporlar için e-posta sunucu ayarlarını yapılandırın.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>SMTP Host</Label>
                                <Input
                                    value={smtpForm.smtpHost}
                                    onChange={(e) => setSmtpForm({ ...smtpForm, smtpHost: e.target.value })}
                                    placeholder="smtp.gmail.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Port</Label>
                                <Input
                                    type="number"
                                    value={smtpForm.smtpPort}
                                    onChange={(e) => setSmtpForm({ ...smtpForm, smtpPort: parseInt(e.target.value) })}
                                    placeholder="587"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Kullanıcı Adı (E-posta)</Label>
                                <Input
                                    value={smtpForm.smtpUser}
                                    onChange={(e) => setSmtpForm({ ...smtpForm, smtpUser: e.target.value })}
                                    placeholder="info@sirket.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Şifre</Label>
                                <Input
                                    type="password"
                                    value={smtpForm.smtpPassword}
                                    onChange={(e) => setSmtpForm({ ...smtpForm, smtpPassword: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Gönderen Kimliği (From Email)</Label>
                            <Input
                                value={smtpForm.smtpFromEmail}
                                onChange={(e) => setSmtpForm({ ...smtpForm, smtpFromEmail: e.target.value })}
                                placeholder="Bildirim <noreply@sirket.com>"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="secure-mode"
                                checked={smtpForm.smtpSecure}
                                onCheckedChange={(c: boolean) => setSmtpForm({ ...smtpForm, smtpSecure: c })}
                            />
                            <Label htmlFor="secure-mode">SSL/TLS Güvenli Bağlantı</Label>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSmtpSave} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Ayarları Kaydet
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* RSS Settings Tab */}
            {activeTab === 'rss' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Yeni RSS Kaynağı Ekle</CardTitle>
                            <CardDescription>
                                Vergi mevzuatı, hibe duyuruları veya sektörel haberleri takip etmek için RSS adresi ekleyin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Kaynak Adı</Label>
                                    <Input
                                        value={rssName}
                                        onChange={(e) => setRssName(e.target.value)}
                                        placeholder="Örn: Resmi Gazete - Vergi"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>RSS URL</Label>
                                    <Input
                                        value={rssUrl}
                                        onChange={(e) => setRssUrl(e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleAddRss} disabled={loading}>
                                <Plus className="mr-2 h-4 w-4" /> Ekle
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Takip Edilen Kaynaklar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {settings?.rssFeeds?.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Henüz bir kaynak eklenmemiş.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {settings?.rssFeeds?.map((feed: any) => (
                                        <div key={feed.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                                    <span className="font-bold text-xs">RSS</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{feed.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{feed.url}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveRss(feed.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
