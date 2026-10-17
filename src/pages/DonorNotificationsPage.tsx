import React from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useNotifications } from "../context/NotificationContext";
import { Bell, Check, CheckCheck, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DonorNotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  return (
    <DashboardLayout
      title="Alerts & System Notifications"
      subtitle="Stay updated on courier arrivals, safety reviews, and rescue completions"
      actions={
        unreadCount > 0 ? (
          <button
            onClick={markAllAsRead}
            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All As Read</span>
          </button>
        ) : undefined
      }
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-sm text-slate-800">No Notifications</h4>
            <p className="text-xs text-slate-500">You're all caught up on all rescue notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`p-4 sm:p-5 text-xs transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  !n.isRead ? "bg-purple-50/40" : "hover:bg-slate-50"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                    {!n.isRead && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[9px] font-black uppercase">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 leading-relaxed max-w-2xl">{n.message}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium pt-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {n.link && (
                    <button
                      onClick={() => {
                        markAsRead(n._id);
                        navigate(n.link!);
                      }}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {!n.isRead && (
                    <button
                      onClick={() => markAsRead(n._id)}
                      className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-slate-100 rounded-lg transition"
                      title="Mark read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
