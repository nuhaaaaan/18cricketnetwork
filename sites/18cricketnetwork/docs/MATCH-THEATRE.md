# Match Theatre, 2126 design language

Original 18CricketNetwork midnight/cyan/violet broadcast design; not an official ICC/IPL affiliation or copied league design. The match centre has a visual-effects preview clearly labelled as non-match data. Player-attributed scorecards use holographic team totals, a decorative three-dimensional field, telemetry and a touch-oriented scorer deck. All established delivery, umpire, approval, share and DRS controls remain unchanged.

## Recorded moments

Fours/sixes require the saved boundary flag; four completed runs do not imply a boundary. Wickets and duck annotations identify the actual dismissed batter. Ducks are not labelled as golden/platinum ducks. Batter 50/100/150/200/250/300 thresholds, five-wicket hauls, 50-run partnership thresholds, maidens, no-ball/free-hit calls, innings closure, revised targets, match completion and play status changes use the saved ledger. The field illustration is decorative, not ball tracking or actual player placement.

Hat-tricks are conservatively detected from three successive legal deliveries by the same bowler with bowler-credited wickets in the same innings. Runouts/other uncredited dismissals and illegal deliveries break detection. Other bowlers' overs do not break the original bowler's delivery sequence. No cross-innings/cross-match or double-hat-trick classification is inferred.

Effects run only for one newly appended event after an observed baseline. Initial load, identical polls, corrections, undo, match switching and multi-event catch-up do not trigger celebrations. Undo clears queued effects; re-recording through the previous event high-water mark does not replay them. Background tabs/disconnected displays rebase before animating again. This is conservative: five-second display polling can miss animations for multiple intervening events, but the scorecard still updates. Delivery timestamps or optimistic clicks are not authoritative evidence.

Motion can be disabled and is saved only as a browser preference. OS reduced-motion displays a static notice. Effects are non-blocking, dismissible, have no audio or flashing and never change scores. ICC/MCC playing-condition support remains exactly that of the established engine, with on-field decisions entered by an authorised scorer. Legacy team-only matches have no invented player milestones. The independent Vercel preview still cannot create or score matches until its backend/authentication are connected.
