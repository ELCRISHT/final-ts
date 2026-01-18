# Testing Multi-User Functionality

## Quick Start Guide

### Prerequisites
- Backend and frontend running
- MongoDB connected
- Stream API keys configured

### Test Scenario 1: Teacher + Multiple Students

#### Step 1: Create Test Users
1. Create 1 teacher account (role: "teacher")
2. Create 3-5 student accounts (role: "student")

#### Step 2: Start a Call
1. Open 4-6 browser windows (or use multiple devices)
2. Log in to each account:
   - Window 1: Teacher account
   - Windows 2-6: Student accounts

#### Step 3: Join the Same Call
1. In each window, navigate to: `/call/test-session-123`
2. Allow camera/microphone permissions
3. All users should join the same call ID

#### Step 4: Verify Multi-User Features

**Teacher View Should Show:**
- ✅ Left panel: Class Monitor dashboard
- ✅ Top-left: Participant count badge
- ✅ Multiple student cards appearing as they join
- ✅ Summary stats (Active: X, Distractions: X, Warnings: X)
- ✅ Each student card is expandable
- ✅ Top-right: Participants list button

**Student View Should Show:**
- ✅ Right panel: Own monitoring status
- ✅ Top-left: Participant count
- ✅ Top-right: Participants list button
- ✅ "Focused" or "Distracted" status

**Click Participant List (Top-Right):**
- ✅ Shows all active participants
- ✅ Shows video/audio status for each
- ✅ Shows connection quality
- ✅ Identifies "You" for local participant

### Test Scenario 2: Trigger Student Distractions

In a student window:
1. **Switch Tab**: Click browser address bar and switch to another tab
   - Should show "Switched Tab" in teacher's dashboard
2. **Minimize Window**: Minimize the browser
   - Should show "Left Window"
3. **Go Idle**: Don't move mouse for 15 seconds
   - Should show "Idle (No Activity)"
4. **Click Comply**: Click the red "I'm Focused Now!" button
   - Should turn status green
   - Teacher should see "Regained Focus"

### Test Scenario 3: Teacher Actions

In teacher window:
1. **Expand Student Card**: Click on any student card
   - Should show detailed metrics
   - Should show recent activity timeline
2. **Add Note**: 
   - Click "Add Note" button on a student
   - Type a note (e.g., "Good participation today")
   - Click "Save Note"
   - Should see success toast
3. **Generate Report**:
   - Click "Report" button on a student
   - Should download a PDF with student activity
   - PDF should include events timeline and notes

### Test Scenario 4: Multiple Simultaneous Distractions

Have 3+ students:
1. Student A: Switch tabs
2. Student B: Go idle
3. Student C: Minimize window
4. **Teacher should see**:
   - All 3 students marked as distracted (red)
   - Separate cards for each with different activities
   - Total distraction count updates
   - Individual distraction counters

### Test Scenario 5: Student Leaves

1. Have 5 students in a call
2. One student closes the browser/tab
3. **Teacher should see**:
   - Student card marked as "offline" (grayed out)
   - Participant count decreases
   - Toast notification (optional)

### Expected Console Logs

**Backend Console:**
```
A user connected <socket-id>
User <user-id> joined call room: test-session-123
Received monitoring event: { eventType: 'distraction', ... }
A user disconnected <socket-id>
```

**Browser Console (Frontend):**
```
Socket connected
Joined call room: test-session-123
Monitoring event sent: { eventType: 'focus', ... }
```

## Common Issues & Solutions

### Issue: Students not appearing in teacher dashboard
**Solution**: 
- Check that students are triggering at least one event (they auto-send on join)
- Verify all users joined the same call ID
- Check browser console for socket connection errors

### Issue: Participant count shows 0
**Solution**:
- Ensure Stream Video SDK is loaded
- Check camera/mic permissions
- Verify Stream API key is correct

### Issue: Distraction events not updating
**Solution**:
- Check socket connection (look for green "LIVE" indicator)
- Verify backend is receiving events (check server logs)
- Ensure student is actually triggering events (try switching tabs)

### Issue: PDF report is empty
**Solution**:
- Wait a few seconds for events to be saved to MongoDB
- Verify MongoDB connection
- Check that student has triggered some events

## Performance Testing

### Test with 10+ Students:
1. Open 10+ browser windows
2. All join same call
3. **Verify:**
   - Dashboard remains responsive
   - Events update in real-time
   - No significant lag
   - Cards can be expanded/collapsed smoothly
   - Participant list loads quickly

### Test Network Issues:
1. Join call with good connection
2. Throttle network (Chrome DevTools → Network → Slow 3G)
3. **Verify:**
   - Connection quality badge updates
   - Events still tracked (may be delayed)
   - Reconnection works automatically

## Success Criteria

✅ **All tests pass if:**
- Multiple students appear simultaneously in teacher view
- Each student tracked independently
- Real-time updates work for all students
- Teacher can interact with individual students
- Participant list shows accurate count and status
- Events are logged and retrievable
- PDF reports generate correctly
- No crashes or freezes with 10+ users

## Video Walkthrough Checklist

1. ☐ Show empty call (just teacher)
2. ☐ Students join one by one (show cards appearing)
3. ☐ Expand a student card (show detailed view)
4. ☐ Trigger various distractions
5. ☐ Show comply button working
6. ☐ Open participant list
7. ☐ Add a teacher note
8. ☐ Generate and show PDF report
9. ☐ Student leaves (show offline status)
10. ☐ Show with 5+ students active

---

**Need Help?** Check:
- Backend logs: `npm run dev` output
- Frontend console: Browser DevTools → Console
- Network tab: Check for failed API calls
- MongoDB: Verify data is being saved
