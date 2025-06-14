import React, { lazy, Suspense } from 'react';
import type { LucideIcon } from 'lucide-react';

// Cache for loaded icons
const iconCache = new Map<string, LucideIcon>();

// Commonly used icons that should be pre-loaded
const preloadIcons = [
  'ChevronRight',
  'ChevronLeft',
  'X',
  'Menu',
  'User',
  'Settings',
  'LogOut',
  'Home',
  'FileText',
  'Check',
  'AlertCircle',
];

// Dynamic icon loader
export async function loadIcon(iconName: string): Promise<LucideIcon | null> {
  // Check cache first
  if (iconCache.has(iconName)) {
    return iconCache.get(iconName)!;
  }

  try {
    const icons = await import('lucide-react');
    const Icon = (icons as any)[iconName] as LucideIcon;
    
    if (Icon) {
      iconCache.set(iconName, Icon);
      return Icon;
    }
    
    console.warn(`Icon "${iconName}" not found in lucide-react`);
    return null;
  } catch (error) {
    console.error(`Error loading icon "${iconName}":`, error);
    return null;
  }
}

// Icon component with dynamic loading
interface DynamicIconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  fallback?: React.ReactNode;
}

export function DynamicIcon({ name, fallback, ...props }: DynamicIconProps) {
  const [Icon, setIcon] = React.useState<LucideIcon | null>(null);

  React.useEffect(() => {
    loadIcon(name).then(setIcon);
  }, [name]);

  if (!Icon) {
    return <>{fallback || <span className="inline-block w-4 h-4 bg-gray-200 rounded animate-pulse" />}</>;
  }

  return <Icon {...props} />;
}

// Preload common icons on app initialization
export function preloadCommonIcons() {
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback if available, otherwise setTimeout
    const callback = () => {
      preloadIcons.forEach(iconName => {
        loadIcon(iconName);
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(callback);
    } else {
      setTimeout(callback, 100);
    }
  }
}

// Export commonly used icons directly for better tree-shaking
export { 
  ChevronRight,
  ChevronLeft,
  X,
  Menu,
  User,
  Settings,
  LogOut,
  Home,
  FileText,
  Check,
  AlertCircle,
  Search,
  Plus,
  Minus,
  Edit,
  Trash,
  Download,
  Upload,
  ExternalLink,
  Copy,
  Save,
  RefreshCw,
  Loader2,
  Star,
  Heart,
  MessageSquare,
  Bell,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  Activity,
  Zap,
  Award,
  Target,
  Flag,
  Bookmark,
  Briefcase,
  Building,
  GraduationCap,
  Book,
  FileText as FileIcon,
  Folder,
  FolderOpen,
  Image,
  Video,
  Mic,
  Volume,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Cpu,
  Monitor,
  Smartphone,
  Tablet,
  Watch,
  Camera,
  Printer,
  Share,
  Share2,
  Link,
  Link2,
  Paperclip,
  Hash,
  AtSign,
  DollarSign,
  Percent,
  Info,
  HelpCircle,
  XCircle,
  CheckCircle,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Inbox,
  Archive,
  Trash2,
  Move,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  Grid,
  List,
  Layers,
  Layout,
  Sidebar,
  PanelLeft,
  PanelRight,
  Square,
  Circle,
  Triangle,
} from 'lucide-react';