import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Bookmark,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Heart,
  ImagePlus,
  MapPin,
  MessageCircle,
  Mic,
  Search,
  Send,
  UserPlus,
  Users,
} from "lucide-react";
import logo from "../assets/logo_1.png";
import PhoneFrame from "../components/PhoneFrame";

type GalleryEvent = {
  title: string;
  when: string;
  location: string;
  going: number;
  attending?: boolean;
  cover: string;
};

const galleryEvents: GalleryEvent[] = [
  {
    title: "Homecoming Concert",
    when: "Fri · 8:00 PM",
    location: "Rec Field",
    going: 480,
    attending: true,
    cover:
      "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=700&q=80",
  },
  {
    title: "Finals Week Study Jam",
    when: "Tue · 7:00 PM",
    location: "Library Atrium",
    going: 96,
    cover:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=80",
  },
  {
    title: "Group Project Showcase",
    when: "Wed · 6:30 PM",
    location: "Innovation Lab",
    going: 140,
    cover:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=700&q=80",
  },
  {
    title: "Battle of the Bands",
    when: "Sat · 8:00 PM",
    location: "Student Union",
    going: 356,
    cover:
      "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=700&q=80",
  },
];

const EventCardPreview = ({ event, hidden }: { event: GalleryEvent; hidden?: boolean }) => (
  <div className="cascade-ev-card" aria-hidden={hidden}>
    <div className="cascade-ev-cover">
      <img src={event.cover} alt={hidden ? "" : event.title} />
      <div className="cascade-ev-overlay">
        <span className="cascade-ev-badge">
          <CalendarDays />
          {event.when}
        </span>
        <b className="cascade-ev-title">{event.title}</b>
        <div className="cascade-ev-loc">
          <MapPin />
          {event.location}
        </div>
      </div>
    </div>
    <div className="cascade-ev-foot">
      <span className="cascade-ev-going">{event.going} going</span>
      <button className={`cascade-ev-rsvp${event.attending ? " going" : ""}`} type="button">
        {event.attending ? "Going ✓" : "Going"}
      </button>
    </div>
  </div>
);

const LandingPage = () => {
  return (
    <main className="cascade-page">
      <div className="cascade-zone cascade-hero-zone">
        <header className="cascade-header">
          <Link className="cascade-brand" to="/">
            <img src={logo} alt="Universe" />
            Universe
          </Link>
          <nav className="cascade-nav">
            <Link className="cascade-navlink" to="/login">
              Log in
            </Link>
            <Link className="cascade-cta" to="/signup">
              Join your campus
            </Link>
          </nav>
        </header>

        <section className="cascade-hero">
          <div className="cascade-hero-copy">
            <h1>
              Where campus <em>comes alive</em>.
            </h1>
            <p>
              Concerts, chaotic study groups, and the project chat that won't stop buzzing
              at 2 a.m. before finals. Universe puts your whole campus, classes, clubs,
              parties, into one live feed, so you're never out of the loop, whether that's
              tonight's show or tomorrow's deadline.
            </p>
            <div className="cascade-btn-row">
              <Link className="cascade-primary" to="/signup">
                Find your university
              </Link>
              <a className="cascade-secondary" href="#how-it-works">
                See how it works
                <ChevronRight className="cascade-s-icon" />
              </a>
            </div>
          </div>

          <div className="cascade-cascade">
            <div className="cascade-scene-item">
            <PhoneFrame variant="side left">
              <div className="cascade-statusbar">
                <span>9:41</span>
                <span />
              </div>
              <div className="cascade-s-chat-head">
                <ArrowLeft className="cascade-s-icon" />
                <div className="cascade-s-chat-avatar">
                  <img src="https://i.pravatar.cc/120?img=44" alt="" />
                  <i className="cascade-s-online" />
                </div>
                <div>
                  <b>Midterm Study Grind</b>
                  <span>6 members</span>
                </div>
              </div>
              <div className="cascade-s-thread">
                <div className="cascade-s-row">
                  <img className="cascade-s-mini" src="https://i.pravatar.cc/120?img=44" alt="" />
                  <div className="cascade-s-bubble in">bro does ANY of this make sense or are we all just vibing 😭</div>
                </div>
                <div className="cascade-s-row out">
                  <div className="cascade-s-bubble out voice">
                    <button className="cascade-s-play" type="button">
                      ▶
                    </button>
                    <span className="cascade-s-wave">
                      <i /><i /><i /><i /><i />
                    </span>
                    <span className="cascade-s-dur">0:14</span>
                  </div>
                </div>
                <div className="cascade-s-row">
                  <img className="cascade-s-mini" src="https://i.pravatar.cc/120?img=5" alt="" />
                  <div>
                    <div className="cascade-s-bubble in">meet at the library 3rd floor, bringing red bulls</div>
                    <div className="cascade-s-reaction">🙏 4</div>
                  </div>
                </div>
              </div>
              <div className="cascade-s-compose">
                <ImagePlus className="cascade-s-icon" />
                <span className="cascade-s-input">Message…</span>
                <Mic className="cascade-s-icon" />
              </div>
            </PhoneFrame>
            <p className="cascade-device-caption">
              The group chat that's always got you (or roasting you) 😭
            </p>
            </div>

            <div className="cascade-scene-item">
            <PhoneFrame variant="main">
              <div className="cascade-statusbar">
                <span>9:41</span>
                <span />
              </div>
              <div className="cascade-app-header">
                <b>For you</b>
                <Bell className="cascade-s-icon" />
              </div>
              <div className="cascade-s-post">
                <div className="cascade-s-post-head">
                  <img className="cascade-s-avatar" src="https://i.pravatar.cc/120?img=32" alt="" />
                  <div className="cascade-s-who">
                    <span className="cascade-s-name">maya.codes</span>
                    <span className="cascade-s-meta">Homecoming Week · 1h</span>
                  </div>
                  <button className="cascade-s-follow" type="button">
                    Following
                  </button>
                </div>
                <img
                  className="cascade-s-photo"
                  src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=700&q=80"
                  alt="Confetti raining over the crowd at the homecoming concert"
                />
                <div className="cascade-s-actions">
                  <Heart className="cascade-s-icon cascade-liked" fill="currentColor" />
                  <MessageCircle className="cascade-s-icon" />
                  <Send className="cascade-s-icon" />
                  <span className="cascade-spacer" />
                  <Bookmark className="cascade-s-icon" />
                </div>
                <div className="cascade-s-likes">342 likes</div>
                <div className="cascade-s-caption">
                  <b>maya.codes</b> the stadium lights hit different at homecoming ✨
                </div>
                <div className="cascade-s-tags">
                  <span>Homecoming</span>
                  <span>Game Night</span>
                </div>
              </div>
            </PhoneFrame>
            <p className="cascade-device-caption">
              Everything happening on campus, live, no cap.
            </p>
            </div>

            <div className="cascade-scene-item">
            <PhoneFrame variant="side right">
              <div className="cascade-statusbar">
                <span>9:41</span>
                <span />
              </div>
              <div className="cascade-app-header">
                <b>Events</b>
                <Search className="cascade-s-icon" />
              </div>
              <div className="cascade-s-event">
                <div className="cascade-s-event-cover">
                  <img
                    src="https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=700&q=80"
                    alt="Homecoming Concert"
                  />
                </div>
                <div className="cascade-s-event-body">
                  <span className="cascade-s-date-badge">
                    <CalendarDays className="cascade-s-icon" />
                    Fri · 8:00 PM
                  </span>
                  <b className="cascade-s-event-title">Homecoming Concert</b>
                  <div className="cascade-s-event-row">
                    <MapPin className="cascade-s-icon" />
                    Rec Field
                  </div>
                  <div className="cascade-s-event-foot">
                    <span className="cascade-s-going-count">480 going</span>
                    <button className="cascade-s-rsvp going" type="button">
                      Going ✓
                    </button>
                  </div>
                </div>
              </div>
              <div className="cascade-s-list-row">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=200&q=60"
                  alt=""
                />
                <div>
                  <div className="cascade-s-lr-name">Finals Week Study Jam</div>
                  <div className="cascade-s-lr-meta">Tue · Library Atrium</div>
                </div>
              </div>
            </PhoneFrame>
            <p className="cascade-device-caption">
              Every event on campus — tap once, you're in.
            </p>
            </div>

            <div className="cascade-callout c-voice">
              <div className="cascade-tag">Voice notes</div>
              <div className="cascade-line" />
            </div>
            <div className="cascade-callout c-rsvp">
              <div className="cascade-tag">One-tap join</div>
              <div className="cascade-line" />
            </div>
          </div>
        </section>
      </div>

      <div className="cascade-zone cascade-split" id="how-it-works">
        <div>
          <PhoneFrame>
            <div className="cascade-statusbar">
              <span>9:41</span>
              <span />
            </div>
            <div className="cascade-app-header">
              <b>Notifications</b>
              <span />
            </div>
            <div className="cascade-s-notif-group">New</div>
            <div className="cascade-s-notif">
              <div className="cascade-s-notif-avatar">
                <img src="https://i.pravatar.cc/120?img=25" alt="" />
                <span className="cascade-badge">
                  <MessageCircle />
                </span>
              </div>
              <div className="cascade-s-notif-txt unread">
                <b>Priya</b> commented on your story
                <span className="cascade-s-notif-time">2m</span>
              </div>
              <span className="cascade-s-notif-dot" />
            </div>
            <div className="cascade-s-notif">
              <div className="cascade-s-notif-avatar">
                <img src="https://i.pravatar.cc/120?img=41" alt="" />
                <span className="cascade-badge">
                  <Users />
                </span>
              </div>
              <div className="cascade-s-notif-txt unread">
                <b>Homecoming Crew</b> invited you to join
                <span className="cascade-s-notif-time">18m</span>
              </div>
              <span className="cascade-s-notif-dot" />
            </div>
            <div className="cascade-s-notif-group">Earlier</div>
            <div className="cascade-s-notif">
              <div className="cascade-s-notif-avatar">
                <img src="https://i.pravatar.cc/120?img=30" alt="" />
                <span className="cascade-badge">
                  <CalendarClock />
                </span>
              </div>
              <div className="cascade-s-notif-txt">
                Reminder — your <b>assignment</b> is due in 2 hours 💀
                <span className="cascade-s-notif-time">Yesterday</span>
              </div>
            </div>
            <div className="cascade-s-notif">
              <div className="cascade-s-notif-avatar">
                <img src="https://i.pravatar.cc/120?img=8" alt="" />
                <span className="cascade-badge">
                  <UserPlus />
                </span>
              </div>
              <div className="cascade-s-notif-txt">
                <b>Jordan</b> started following you
                <span className="cascade-s-notif-time">Yesterday</span>
              </div>
            </div>
          </PhoneFrame>
        </div>
        <div>
          <h2>You hear about it before it's over.</h2>
          <p>
            No platform-wide blast. Notifications only surface the groups you're in, the
            people you follow, and the deadlines and events you're actually tracking, so
            the one that matters doesn't get lost in the ones that don't.
          </p>
        </div>
      </div>

      <div className="cascade-zone cascade-gallery">
        <div className="cascade-gallery-head">
          <div>
            <h2>Never miss what's happening</h2>
            <p>The same Events tab shown above, real turnout, not a stock photo reel.</p>
          </div>
          <Link className="cascade-see-all" to="/signup">
            See all events
            <ChevronRight className="cascade-s-icon" />
          </Link>
        </div>
        <div className="cascade-strip">
          <div className="cascade-strip-track">
            {galleryEvents.map((event) => (
              <EventCardPreview key={event.title} event={event} />
            ))}
            {galleryEvents.map((event) => (
              <EventCardPreview key={`${event.title}-repeat`} event={event} hidden />
            ))}
          </div>
        </div>
      </div>

      <div className="cascade-zone">
        <footer className="cascade-footer">
          <span className="cascade-brand">Universe</span>
          <span>Built for one campus at a time.</span>
        </footer>
      </div>
    </main>
  );
};

export default LandingPage;
