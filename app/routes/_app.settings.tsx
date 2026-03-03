import { type LoaderFunctionArgs, type MetaFunction } from 'react-router';
import { Link } from 'react-router';
import { requireSession } from '@app/lib/auth.server';
import { useTheme } from '@app/hooks/useTheme';
import {
  Sun,
  Moon,
  Monitor,
  Bell,
  Shield,
  Download,
  ChevronRight,
  Globe,
  Palette,
} from 'lucide-react';

export const meta: MetaFunction = () => [
  { title: 'Pengaturan | Finance Tracker' },
];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireSession(request);
  return Response.json({});
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-5 pt-4 pb-1">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  label,
  description,
  onClick,
  href,
  rightElement,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick?: () => void;
  href?: string;
  rightElement?: React.ReactNode;
}) {
  const content = (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--text-primary)]/5 transition-colors text-[var(--text-primary)] w-full">
      <div className="w-9 h-9 rounded-xl bg-[var(--text-primary)]/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[var(--text-primary)]" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
        {description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>}
      </div>
      {rightElement ?? <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />}
    </div>
  );

  if (href) return <Link to={href}>{content}</Link>;
  return <button type="button" onClick={onClick} className="w-full">{content}</button>;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-28 animate-fade-in pt-2">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] px-1">Pengaturan</h1>

      {/* Theme */}
      <div className="glass-card rounded-[2rem] border border-[var(--card-border)] overflow-hidden">
        <SectionHeader title="Tampilan" />
        <div className="px-5 pb-4 pt-2">
          <p className="text-xs text-slate-500 mb-3">Tema Warna</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'light', icon: Sun, label: 'Terang' },
              { value: 'dark', icon: Moon, label: 'Gelap' },
              { value: 'system', icon: Monitor, label: 'Sistem' },
            ] as const).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                  theme === value
                    ? 'border-[var(--text-primary)] bg-[var(--text-primary)]/10 text-[var(--text-primary)]'
                    : 'border-[var(--card-border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]/40 hover:bg-[var(--text-primary)]/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card rounded-[2rem] border border-[var(--card-border)] overflow-hidden">
        <SectionHeader title="Notifikasi" />
        <div className="divide-y divide-black/5 dark:divide-white/5">
          <SettingRow
            icon={Bell}
            label="Pemberitahuan Push"
            description="Terima pengingat anggaran dan ringkasan mingguan"
          />
        </div>
      </div>

      {/* Account */}
      <div className="glass-card rounded-[2rem] border border-[var(--card-border)] overflow-hidden">
        <SectionHeader title="Akun & Privasi" />
        <div className="divide-y divide-black/5 dark:divide-white/5">
          <SettingRow icon={Shield} label="Ubah Kata Sandi" description="Perbarui keamanan akun Anda" />
          <SettingRow icon={Globe} label="Bahasa" description="Indonesia" />
          <SettingRow
            icon={Download}
            label="Ekspor Data"
            description="Unduh semua transaksi sebagai CSV"
          />
        </div>
      </div>

      {/* About */}
      <div className="glass-card rounded-[2rem] border border-[var(--card-border)] overflow-hidden">
        <SectionHeader title="Tentang" />
        <div className="px-5 py-4 space-y-1 text-sm text-[var(--text-secondary)]">
          <div className="flex justify-between"><span>Versi</span><span className="font-semibold text-[var(--text-primary)]">1.0.0</span></div>
          <div className="flex justify-between"><span>Platform</span><span className="font-semibold text-[var(--text-primary)]">Web / PWA</span></div>
        </div>
      </div>
    </div>
  );
}
