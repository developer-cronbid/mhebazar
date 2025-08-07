"use client";
import Breadcrumb from "@/components/elements/Breadcrumb";

const notifications = [
  {
    id: 1,
    title: "MHE Bazar Recommended new arrival product",
    time: "1 minute ago",
  },
  {
    id: 2,
    title: "MHE Bazar Recommended new arrival product",
    time: "1 minute ago",
  },
  {
    id: 3,
    title: "MHE Bazar Recommended new arrival product",
    time: "1 minute ago",
  },
  {
    id: 4,
    title: "MHE Bazar Recommended new arrival product",
    time: "1 minute ago",
  },
];

const NotificationPage = () => {
  return (
    <>
      {/* Breadcrumb */}
      <div className="w-full px-4 sm:px-8 pt-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Notification", href: "/notifications" },
          ]}
        />
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8">Notifications</h2>
        <div className="flex flex-col gap-6">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-center bg-white rounded-2xl shadow-[0_4px_16px_0_rgba(0,0,0,0.03)] px-6 py-6 sm:py-7"
            >
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-500 mr-6">
                MB
              </div>
              <div>
                <div className="text-base sm:text-lg">
                  <span className="font-bold text-gray-700">MHE Bazar</span>{" "}
                  <span className="text-gray-700">{notification.title.replace("MHE Bazar ", "")}</span>
                </div>
                <div className="text-gray-400 text-sm mt-1">{notification.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default NotificationPage;