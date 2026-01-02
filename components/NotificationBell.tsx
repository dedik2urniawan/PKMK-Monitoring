"use client";
import { useEffect, useState, useRef } from "react";
import { Bell, Package, Activity, AlertTriangle, X } from "lucide-react";
import { getAuthHeaders } from "@/lib/clientSession";
import Link from "next/link";

interface Notification {
    id: string;
    type: 'stok_habis' | 'stok_menipis' | 'monitoring_overdue' | 'kohort_pending' | 'redflag';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    link: string;
    timestamp: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [count, setCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
        // Refresh every 5 minutes
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function fetchNotifications() {
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/notifications', {
                credentials: 'include',
                headers: authHeaders
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setCount(data.count || 0);
            }
        } catch (e) {
            console.error('[NotificationBell] Error:', e);
        }
        setLoading(false);
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'stok_habis':
            case 'stok_menipis':
                return <Package size={16} />;
            case 'monitoring_overdue':
            case 'kohort_pending':
                return <Activity size={16} />;
            case 'redflag':
                return <AlertTriangle size={16} />;
            default:
                return <Bell size={16} />;
        }
    };

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'high':
                return { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' };
            case 'medium':
                return { bg: '#fef3c7', color: '#d97706', border: '#fde68a' };
            default:
                return { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' };
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Hari ini';
        if (days === 1) return 'Kemarin';
        if (days < 7) return `${days} hari lalu`;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    border: 'none',
                    background: isOpen ? '#f0fdf4' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                }}
            >
                <Bell size={20} color={count > 0 ? '#059669' : '#9ca3af'} />
                {count > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        background: '#dc2626',
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px'
                    }}>
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 50,
                    right: 0,
                    width: 360,
                    maxHeight: 480,
                    background: 'white',
                    borderRadius: 16,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                    zIndex: 1000
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f9fafb'
                    }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111518' }}>Notifikasi</h3>
                            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{count} pesan baru</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                border: 'none',
                                background: '#e5e7eb',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Notifications List */}
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                                Memuat...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                                <Bell size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                                <p style={{ margin: 0 }}>Tidak ada notifikasi</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const styles = getPriorityStyles(notif.priority);
                                return (
                                    <Link
                                        key={notif.id}
                                        href={notif.link}
                                        onClick={() => setIsOpen(false)}
                                        style={{
                                            display: 'flex',
                                            gap: 12,
                                            padding: '14px 20px',
                                            borderBottom: '1px solid #f3f4f6',
                                            textDecoration: 'none',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {/* Icon */}
                                        <div style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 10,
                                            background: styles.bg,
                                            color: styles.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {getIcon(notif.type)}
                                        </div>

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: styles.color,
                                                marginBottom: 2
                                            }}>
                                                {notif.title}
                                            </div>
                                            <div style={{
                                                fontSize: 13,
                                                color: '#374151',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {notif.message}
                                            </div>
                                            <div style={{
                                                fontSize: 11,
                                                color: '#9ca3af',
                                                marginTop: 4
                                            }}>
                                                {formatTime(notif.timestamp)}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div style={{
                            padding: '12px 20px',
                            borderTop: '1px solid #e5e7eb',
                            background: '#f9fafb',
                            textAlign: 'center'
                        }}>
                            <Link
                                href="/dashboard"
                                onClick={() => setIsOpen(false)}
                                style={{
                                    fontSize: 13,
                                    color: '#059669',
                                    fontWeight: 500,
                                    textDecoration: 'none'
                                }}
                            >
                                Lihat semua aktivitas →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
