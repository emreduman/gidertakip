'use client';

import { useState, useEffect } from "react";
import { Folder, FileText, User, ChevronRight, ArrowLeft, Loader2, Calendar } from "lucide-react";
import {
    getProjects,
    getPeriods,
    getUsersInPeriod,
    getUserFiles
} from "@/actions/file-manager";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function FileManager({ organizationId }: { organizationId: string }) {
    const [level, setLevel] = useState<0 | 1 | 2 | 3>(0);
    const [loading, setLoading] = useState(false);

    const [projects, setProjects] = useState<any[]>([]);
    const [periods, setPeriods] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [files, setFiles] = useState<any[]>([]);

    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Initial load - Projects
    useEffect(() => {
        loadProjects();
    }, [organizationId]);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const data = await getProjects(organizationId); // Assuming server action handles auth check
            setProjects(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleProjectClick = async (project: any) => {
        setLoading(true);
        setSelectedProject(project);
        try {
            const data = await getPeriods(project.id);
            setPeriods(data);
            setLevel(1);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodClick = async (period: any) => {
        setLoading(true);
        setSelectedPeriod(period);
        try {
            const data = await getUsersInPeriod(period.id);
            setUsers(data);
            setLevel(2);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUserClick = async (user: any) => {
        setLoading(true);
        setSelectedUser(user);
        try {
            const data = await getUserFiles(selectedPeriod.id, user.id);
            setFiles(data);
            setLevel(3);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (level === 1) {
            setLevel(0);
            setSelectedProject(null);
        } else if (level === 2) {
            setLevel(1);
            setSelectedPeriod(null);
        } else if (level === 3) {
            setLevel(2);
            setSelectedUser(null);
        }
    };

    const Breadcrumbs = () => (
        <div className="flex items-center text-sm text-muted-foreground mb-4 overflow-x-auto whitespace-nowrap pb-2">
            <span
                className={`cursor-pointer hover:text-primary ${level === 0 ? 'font-bold text-foreground' : ''}`}
                onClick={() => { setLevel(0); setSelectedProject(null); }}
            >
                Projeler
            </span>
            {selectedProject && (
                <>
                    <ChevronRight className="w-4 h-4 mx-1" />
                    <span
                        className={`cursor-pointer hover:text-primary ${level === 1 ? 'font-bold text-foreground' : ''}`}
                        onClick={() => { setLevel(1); setSelectedPeriod(null); }}
                    >
                        {selectedProject.name}
                    </span>
                </>
            )}
            {selectedPeriod && (
                <>
                    <ChevronRight className="w-4 h-4 mx-1" />
                    <span
                        className={`cursor-pointer hover:text-primary ${level === 2 ? 'font-bold text-foreground' : ''}`}
                        onClick={() => { setLevel(2); setSelectedUser(null); }}
                    >
                        {selectedPeriod.name}
                    </span>
                </>
            )}
            {selectedUser && (
                <>
                    <ChevronRight className="w-4 h-4 mx-1" />
                    <span className="font-bold text-foreground">
                        {selectedUser.name || selectedUser.email}
                    </span>
                </>
            )}
        </div>
    );

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Dosya Yöneticisi</CardTitle>
                        <CardDescription>Fiş ve faturaları klasör yapısında görüntüleyin</CardDescription>
                    </div>
                    {level > 0 && (
                        <Button variant="outline" size="sm" onClick={handleBack}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Geri Dön
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <Breadcrumbs />

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {level === 0 && projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => handleProjectClick(project)}
                                className="group cursor-pointer p-4 border rounded-lg hover:bg-accent hover:border-primary transition-all flex flex-col items-center text-center space-y-3"
                            >
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full group-hover:scale-110 transition-transform">
                                    <Folder className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-lg">{project.name}</h3>
                                    <p className="text-xs text-muted-foreground">Proje Klasörü</p>
                                </div>
                            </div>
                        ))}

                        {level === 1 && periods.map((period) => (
                            <div
                                key={period.id}
                                onClick={() => handlePeriodClick(period)}
                                className="group cursor-pointer p-4 border rounded-lg hover:bg-accent hover:border-primary transition-all flex flex-col items-center text-center space-y-3"
                            >
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full group-hover:scale-110 transition-transform">
                                    <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-lg">{period.name}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {format(new Date(period.startDate), 'MMM yyyy', { locale: tr })} - {format(new Date(period.endDate), 'MMM yyyy', { locale: tr })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {level === 2 && users.map((user) => (
                            <div
                                key={user.id}
                                onClick={() => handleUserClick(user)}
                                className="group cursor-pointer p-4 border rounded-lg hover:bg-accent hover:border-primary transition-all flex flex-col items-center text-center space-y-3"
                            >
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full group-hover:scale-110 transition-transform">
                                    <User className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-lg">{user.name || user.email?.split('@')[0]}</h3>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                        ))}

                        {level === 3 && files.map((file) => (
                            <div
                                key={file.id}
                                className="group relative p-4 border rounded-lg hover:bg-accent transition-all flex flex-col space-y-3"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                        <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {file.amount ? `${file.amount} ₺` : '-'}
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className="font-medium text-sm line-clamp-1" title={file.description || "Açıklama yok"}>
                                        {file.merchant || "Bilinmeyen Satıcı"}
                                    </h3>
                                    <p className="text-xs text-muted-foreground pt-1">
                                        {format(new Date(file.date), 'dd MMM yyyy', { locale: tr })}
                                    </p>
                                </div>
                                {file.receiptUrl && (
                                    <a
                                        href={file.receiptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 w-full inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                                    >
                                        Görüntüle
                                    </a>
                                )}
                            </div>
                        ))}

                        {/* Empty States */}
                        {!loading && level === 0 && projects.length === 0 && (
                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                Henüz hiç proje bulunmuyor.
                            </div>
                        )}
                        {!loading && level === 1 && periods.length === 0 && (
                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                Bu projede henüz dönem (period) tanımlanmamış.
                            </div>
                        )}
                        {!loading && level === 2 && users.length === 0 && (
                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                Bu dönemde harcama yapan kullanıcı bulunamadı.
                            </div>
                        )}
                        {!loading && level === 3 && files.length === 0 && (
                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                Bu kullanıcıya ait fiş/fatura bulunamadı.
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
