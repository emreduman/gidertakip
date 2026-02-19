'use client';

import Link from "next/link";
import { ArrowRight, PieChart, Receipt, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6 mx-auto">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold font-mono">G</span>
            </div>
            <span className="text-lg font-bold tracking-tight">GiderTakip</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              href="/login"
              className="hidden md:inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              Ücretsiz Başla
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-muted/50">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              className="flex flex-col items-center space-y-4 text-center"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                  Harcamalarınızı <br className="hidden md:inline" />
                  Yapay Zeka ile Yönetin
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Fişleri fotoğrafını çekerek yükleyin, AI otomatik analiz etsin. Onay süreçlerini hızlandırın ve bütçenizi kontrol altına alın.
                </p>
              </motion.div>
              <motion.div variants={itemVariants} className="space-x-4 pt-4">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Hemen Başla
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Daha Fazla Bilgi
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-muted-foreground">
                Özellikler
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Neden GiderTakip?
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Modern işletmeler ve STK'lar için tasarlanmış, uçtan uca masraf yönetim çözümü.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Receipt,
                  title: "AI Destekli Fiş Okuma",
                  desc: "Fişinizin fotoğrafını yükleyin, yapay zeka tarih, tutar, satıcı ve kategoriyi otomatik ayrıştırır."
                },
                {
                  icon: ShieldCheck,
                  title: "Esnek Onay Süreçleri",
                  desc: "Harcamalarınızı departman yöneticileri, muhasebe ve finans ekiplerinin onayına sunun."
                },
                {
                  icon: PieChart,
                  title: "Detaylı Raporlama",
                  desc: "Departman, proje veya kategori bazlı harcamaları gerçek zamanlı grafiklerle izleyin."
                }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  className="flex flex-col items-center text-center p-6 border rounded-xl shadow-sm hover:shadow-md transition-shadow bg-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Harcamalarınızı Kontrol Altına Alın
              </h2>
              <p className="mx-auto max-w-[600px] md:text-xl opacity-90">
                Excel tabloları ve kaybolan fişlerle uğraşmayı bırakın. GiderTakip ile modern masraf yönetimine geçin.
              </p>
              <div className="w-full max-w-sm space-y-2 pt-4">
                <Link
                  href="/login"
                  className="inline-flex h-12 w-full items-center justify-center rounded-md bg-background text-primary px-8 text-sm font-bold shadow transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Ücretsiz Hesap Oluştur
                </Link>
                <p className="text-xs opacity-75">
                  Kredi kartı gerekmez. 14 gün ücretsiz deneme.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row md:px-6 mx-auto">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; 2026 GiderTakip Inc. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:underline">Gizlilik</Link>
            <Link href="#" className="hover:underline">Kullanım Şartları</Link>
            <Link href="#" className="hover:underline">İletişim</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
