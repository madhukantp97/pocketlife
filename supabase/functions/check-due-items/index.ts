import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Check reminders that are due (within the last 5 minutes window to avoid duplicates)
    const { data: dueReminders } = await supabase
      .from("pocketapp_reminders")
      .select("*")
      .lte("reminder_date", now.toISOString())
      .gte("reminder_date", fiveMinAgo.toISOString())
      .eq("notified", false);

    if (dueReminders && dueReminders.length > 0) {
      const notifications = dueReminders.map((r: any) => ({
        user_id: r.user_id,
        title: "🔔 Reminder due now",
        message: r.title,
        type: "reminder",
      }));
      await supabase.from("pocketapp_notifications").insert(notifications);
      // Mark as notified
      const ids = dueReminders.map((r: any) => r.id);
      await supabase
        .from("pocketapp_reminders")
        .update({ notified: true })
        .in("id", ids);
    }

    // Check reminders with alert_before that haven't been notified yet
    const { data: alertReminders } = await supabase
      .from("pocketapp_reminders")
      .select("*")
      .eq("notified", false)
      .gt("alert_before", 0);

    if (alertReminders && alertReminders.length > 0) {
      const alertNotifications: any[] = [];
      for (const r of alertReminders) {
        const alertTime = new Date(
          new Date(r.reminder_date).getTime() - (r.alert_before || 0) * 60 * 1000
        );
        if (alertTime >= fiveMinAgo && alertTime <= now) {
          alertNotifications.push({
            user_id: r.user_id,
            title: `⏰ Reminder in ${r.alert_before} min`,
            message: r.title,
            type: "reminder",
          });
        }
      }
      if (alertNotifications.length > 0) {
        await supabase.from("pocketapp_notifications").insert(alertNotifications);
      }
    }

    // Check todos due today that haven't been completed
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const hour = now.getHours();
    const minute = now.getMinutes();
    if (hour === 8 && minute < 5) {
      const { data: dueTodos } = await supabase
        .from("pocketapp_todos")
        .select("*")
        .gte("due_date", todayStart)
        .lt("due_date", todayEnd)
        .eq("completed", false);

      if (dueTodos && dueTodos.length > 0) {
        const byUser: Record<string, any[]> = {};
        for (const t of dueTodos) {
          if (!byUser[t.user_id]) byUser[t.user_id] = [];
          byUser[t.user_id].push(t);
        }
        const todoNotifs = Object.entries(byUser).map(([userId, todos]) => ({
          user_id: userId,
          title: "📋 Tasks due today",
          message: `You have ${todos.length} task${todos.length > 1 ? "s" : ""} due: ${todos.map((t: any) => t.title).join(", ")}`,
          type: "todo",
        }));
        await supabase.from("pocketapp_notifications").insert(todoNotifs);
      }
    }

    // Check important dates (recurring yearly)
    if (hour === 8 && minute < 5) {
      const todayMonth = now.getMonth() + 1;
      const todayDay = now.getDate();
      const tomorrowDate = new Date(now);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowMonth = tomorrowDate.getMonth() + 1;
      const tomorrowDay = tomorrowDate.getDate();

      const { data: allDates } = await supabase
        .from("pocketapp_important_dates")
        .select("*");

      if (allDates && allDates.length > 0) {
        const dateNotifs: any[] = [];
        for (const d of allDates) {
          const eventDate = new Date(d.date);
          const eMonth = eventDate.getMonth() + 1;
          const eDay = eventDate.getDate();

          if (eMonth === todayMonth && eDay === todayDay) {
            dateNotifs.push({
              user_id: d.user_id,
              title: `🎉 Today: ${d.name}`,
              message: `${d.event_type} — ${d.name} is today!`,
              type: "reminder",
            });
          } else if (eMonth === tomorrowMonth && eDay === tomorrowDay) {
            dateNotifs.push({
              user_id: d.user_id,
              title: `⏰ Tomorrow: ${d.name}`,
              message: `${d.event_type} — ${d.name} is tomorrow!`,
              type: "reminder",
            });
          }
        }
        if (dateNotifs.length > 0) {
          await supabase.from("pocketapp_notifications").insert(dateNotifs);
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, reminders: dueReminders?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
