import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { RestorationProject } from "../../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://mangrove-guardian-ai.onrender.com/api"
    : "http://localhost:8000/api");

// SVG Icons
const Icons = {
  Globe: () => (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20H7m6-4h.01M9 20h6" />
    </svg>
  ),
  Trees: () => (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2zm6 16H6v2h12v-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12c-.6-.8-1-1.8-1-3 0-2.2 1.8-4 4-4s4 1.8 4 4c0 1.2-.4 2.2-1 3" />
    </svg>
  ),
  MapPin: () => (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Users: () => (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 8.048M12 4.354c2.668 0 4.854 1.838 5.648 4.354M8.352 8.354c-.768 2.516 1.28 4.354 3.648 4.354m0-8.708V15m0 0h6m-6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
    </svg>
  ),
  Building: () => (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Camera: () => (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Leaf: () => (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  BarChart: () => (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Signal: () => (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
    </svg>
  ),
  Handshake: () => (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m0 0l-2-1m2 1v2.5M14 4l-2 1m0 0l-2-1m2 1v2.5m6 0l-2 1m0 0l-2-1m2 1v2.5M9 14l-2 1m0 0l-2-1m2 1v2.5m6 0l-2 1m0 0l-2-1m2 1v2.5" />
    </svg>
  ),
  Star: () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
};

function normalizeList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && Array.isArray((payload as { results?: unknown[] }).results)) {
    return (payload as { results: T[] }).results;
  }
  return [];
}

const completedProjectIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const sampleTestimonials = [
  {
    quote:
      "Mangrove Guardian AI helped our volunteers identify damage zones in hours instead of weeks.",
    author: "Dina Rahma, Coastal Volunteer",
  },
  {
    quote:
      "The restoration map gave our team clear priorities and made progress reporting transparent.",
    author: "Blue Estuary Foundation",
  },
  {
    quote:
      "Community photo reporting plus AI insights made restoration planning more accurate and faster.",
    author: "El Mouataz Benmanssour",
  },
];

export function LandingPage() {
  const [projects, setProjects] = useState<RestorationProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState<string | null>(null);
  const [communitiesCount] = useState(0);
  const [organizationsCount] = useState(0);

  useEffect(() => {
    const fetchCompletedProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/projects/completed-public/`);
        if (!response.ok) {
          throw new Error("Failed to load completed restoration projects");
        }
        const data = await response.json();
        setProjects(normalizeList<RestorationProject>(data));
      } catch (_fetchError) {
        setError("Unable to load completed project map at the moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedProjects();
  }, []);

  const totalTrees = useMemo(
    () =>
      projects.reduce(
        (sum, project) => sum + (project.events?.reduce((eventSum, event) => eventSum + event.trees_planted, 0) || 0),
        0
      ),
    [projects]
  );

  const totalEvents = useMemo(
    () => projects.reduce((sum, project) => sum + (project.events?.length || 0), 0),
    [projects]
  );

  const mapCenter: [number, number] = useMemo(() => {
    const mappedProjects = projects.filter(
      (project) => Number.isFinite(project.lat) && Number.isFinite(project.lng)
    );
    if (mappedProjects.length === 0) {
      return [-6.9175, 107.6191];
    }

    const avgLat = mappedProjects.reduce((sum, project) => sum + project.lat, 0) / mappedProjects.length;
    const avgLng = mappedProjects.reduce((sum, project) => sum + project.lng, 0) / mappedProjects.length;
    return [avgLat, avgLng];
  }, [projects]);

  const onNewsletterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setNewsletterMessage("Please enter your email address.");
      return;
    }
    setNewsletterMessage("Thanks for subscribing. We will keep you updated.");
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-emerald-50 via-cyan-50 to-sky-50 text-slate-900">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.6s ease-out forwards;
        }
      `}</style>
      
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16 lg:px-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-linear-to-br from-white via-emerald-50 to-cyan-50 p-8 shadow-xl md:p-12 lg:p-16">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-200/50 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-cyan-200/50 blur-3xl" />
          
          <div className="relative max-w-3xl">
            <div className="animate-slide-in-left">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Conservation Platform</p>
              <h1 className="mt-4 text-5xl font-black leading-tight text-slate-900 md:text-7xl">
                Protecting Mangroves with <span className="bg-linear-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">AI</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-700">
                Analyze, restore, and monitor mangrove ecosystems in real time. Empower communities to detect damage and track restoration impact.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link 
                  to="/register" 
                  className="group relative overflow-hidden rounded-xl bg-linear-to-r from-emerald-600 to-emerald-500 px-8 py-4 font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/50"
                >
                  <span className="relative z-10">Get Started</span>
                </Link>
                <Link 
                  to="/login" 
                  className="rounded-xl border-2 border-emerald-600 px-8 py-4 font-bold text-emerald-600 transition-all duration-300 hover:bg-emerald-50"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Stats Section */}
        <section className="mt-16 grid gap-5 md:grid-cols-3 lg:grid-cols-5">
          {[
            { Icon: Icons.Globe, label: "Completed Projects", value: projects.length, color: "emerald" },
            { Icon: Icons.Trees, label: "Trees Restored", value: totalTrees, color: "green" },
            { Icon: Icons.MapPin, label: "Restoration Events", value: totalEvents, color: "teal" },
            { Icon: Icons.Users, label: "Communities", value: communitiesCount, color: "cyan" },
            { Icon: Icons.Building, label: "Organizations", value: organizationsCount, color: "emerald" }
          ].map((stat) => (
            <article 
              key={stat.label}
              className={`group rounded-2xl border-2 border-${stat.color}-200 bg-linear-to-br from-white to-${stat.color}-50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105`}
            >
              <div className={`text-${stat.color}-600`}>
                <stat.Icon />
              </div>
              <p className={`mt-3 text-xs font-bold uppercase tracking-wider text-${stat.color}-700`}>{stat.label}</p>
              <p className={`mt-2 text-4xl font-black text-${stat.color}-600`}>{stat.value}</p>
            </article>
          ))}
        </section>

        {/* About Section */}
        <section className="mt-16 rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-lg md:p-12">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-black text-slate-900">About Mangrove Guardian</h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-700">
              Mangrove Guardian AI helps communities and organizations detect mangrove damage through advanced AI photo analysis, track restoration projects with precision, and monitor progress transparently. Our platform transforms field reports into actionable conservation intelligence so restoration efforts can be <span className="font-bold text-emerald-700">faster, smarter, and more impactful</span>.
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mt-16">
          <h2 className="text-4xl font-black text-slate-900">How It Works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { step: "1", Icon: Icons.Camera, title: "Submit a mangrove photo", desc: "Community users upload location-tagged photos from the field", color: "emerald" },
              { step: "2", Icon: Icons.Sparkles, title: "AI analyzes health and damage", desc: "The model scores mangrove health and flags potential risks quickly", color: "cyan" },
              { step: "3", Icon: Icons.Leaf, title: "Organizations plan restoration", desc: "Organizations prioritize intervention areas and record restoration progress", color: "teal" }
            ].map((item) => (
              <article 
                key={item.step}
                className={`group relative rounded-2xl border-2 border-${item.color}-200 bg-linear-to-br from-white to-${item.color}-50 p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-2`}
              >
                <div className={`absolute -top-6 left-8 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-r from-${item.color}-600 to-${item.color}-500 font-bold text-white text-lg`}>
                  {item.step}
                </div>
                <div className={`text-${item.color}-600`}>
                  <item.Icon />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-slate-700">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="mt-16">
          <div>
            <h2 className="text-4xl font-black text-slate-900">Powerful Features</h2>
            <p className="mt-3 max-w-2xl text-lg text-slate-600">Everything you need to protect and restore mangrove ecosystems</p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: Icons.Sparkles, title: "Fast AI Analysis", desc: "Rapid health and damage assessment from field images" },
              { Icon: Icons.BarChart, title: "Organization Dashboard", desc: "Manage reports, projects, and event outcomes" },
              { Icon: Icons.Signal, title: "Real-Time Updates", desc: "Track analysis status and restoration progress" },
              { Icon: Icons.Handshake, title: "Community Reporting", desc: "Empower communities to contribute to conservation" }
            ].map((feature) => (
              <article 
                key={feature.title}
                className="group rounded-2xl border-2 border-slate-200 bg-linear-to-br from-white to-slate-50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-emerald-300"
              >
                <div className="text-emerald-600 transition-transform duration-300 group-hover:scale-125">
                  <feature.Icon />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-700">{feature.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="mt-16">
          <div>
            <h2 className="text-4xl font-black text-slate-900">Impact Stories</h2>
            <p className="mt-3 text-lg text-slate-600">Hear from volunteers and conservation leaders</p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {sampleTestimonials.map((testimonial, idx) => (
              <article 
                key={testimonial.author}
                className="rounded-2xl border-2 border-emerald-200 bg-linear-to-br from-emerald-50 to-cyan-50 p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-emerald-600">
                      <Icons.Star />
                    </span>
                  ))}
                </div>
                <p className="text-lg leading-relaxed text-slate-800 italic">"{testimonial.quote}"</p>
                <p className="mt-4 font-bold text-emerald-700">— {testimonial.author}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Map Section */}
        <section className="mt-16 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-lg">
          <div className="border-b-2 border-slate-200 bg-linear-to-r from-emerald-50 to-cyan-50 px-8 py-6">
            <h2 className="text-3xl font-black text-slate-900">Completed Restoration Projects</h2>
            <p className="mt-2 text-slate-700">Track restoration impact across coastal regions</p>
          </div>
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-300 border-t-emerald-600" />
                <p className="mt-2 text-slate-600">Loading map data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-96 items-center justify-center">
              <p className="text-lg font-semibold text-red-600">{error}</p>
            </div>
          ) : (
            <MapContainer center={mapCenter} zoom={7} className="h-96 w-full z-0">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {projects
                .filter((project) => Number.isFinite(project.lat) && Number.isFinite(project.lng))
                .map((project) => (
                  <Marker key={project.id} position={[project.lat, project.lng]} icon={completedProjectIcon}>
                    <Popup>
                      <div className="min-w-48">
                        <p className="text-lg font-bold text-slate-900">{project.name}</p>
                        <p className="mt-2 text-sm text-slate-700">📍 {project.location}</p>
                        <p className="mt-1 text-sm text-slate-600">Status: <span className="font-semibold text-emerald-600">{project.status}</span></p>
                        <p className="mt-1 text-sm text-slate-600">🌱 Trees: {project.events?.reduce((sum, event) => sum + event.trees_planted, 0) || 0}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          )}
        </section>

        {/* CTA Section */}
        <section className="relative mt-16 overflow-hidden rounded-3xl border-2 border-emerald-300 bg-linear-to-r from-emerald-600 to-cyan-600 p-12 text-white shadow-2xl">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/30 blur-3xl" />
          
          <div className="relative max-w-2xl">
            <h2 className="text-4xl font-black">Ready to Make an Impact?</h2>
            <p className="mt-4 text-lg text-emerald-50">Join our community of volunteers and organizations protecting mangrove ecosystems worldwide.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link 
                to="/register" 
                className="rounded-xl bg-white px-8 py-4 font-bold text-emerald-600 transition-all duration-300 hover:bg-emerald-50 hover:shadow-lg"
              >
                Start Contributing
              </Link>
              <a 
                href="#" 
                className="rounded-xl border-2 border-white px-8 py-4 font-bold text-white transition-all duration-300 hover:bg-white/20"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative mt-16 overflow-hidden rounded-2xl border-2 border-emerald-200 text-slate-900">
          <img
            src="https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=1600&q=80"
            alt="Mangrove roots and coastal water"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-r from-emerald-50/60 to-cyan-50/40 backdrop-blur-sm" />

          <div className="relative px-8 py-12 md:px-12">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl bg-white/95 p-6 shadow-xl backdrop-blur">
                <h3 className="text-2xl font-black text-slate-900">Mangrove Guardian</h3>
                <p className="mt-3 text-slate-700">Protecting coastal ecosystems through AI and community action.</p>
                <p className="mt-4 text-sm font-semibold text-emerald-600">📧 hello@mangroveguardian.ai</p>
              </div>

              <div className="rounded-2xl bg-white/95 p-6 shadow-xl backdrop-blur">
                <h4 className="text-lg font-bold text-slate-900 uppercase tracking-widest">Connect With Us</h4>
                <div className="mt-4 flex flex-wrap gap-3">
                  {["X", "LinkedIn", "Instagram"].map((social) => (
                    <a 
                      key={social}
                      href="#" 
                      className="rounded-full bg-linear-to-r from-emerald-600 to-emerald-500 px-4 py-2 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/50"
                    >
                      {social}
                    </a>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white/95 p-6 shadow-xl backdrop-blur">
                <h4 className="text-lg font-bold text-slate-900 uppercase tracking-widest">Newsletter</h4>
                <p className="mt-2 text-sm text-slate-700">Get updates on conservation impact and new features.</p>
                <form className="mt-4 flex gap-2" onSubmit={onNewsletterSubmit}>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Your email"
                    className="flex-1 rounded-lg border-2 border-emerald-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:border-emerald-600 focus:outline-none"
                  />
                  <button 
                    type="submit" 
                    className="rounded-lg bg-linear-to-r from-emerald-600 to-emerald-500 px-4 py-2 font-bold text-white transition-all duration-300 hover:shadow-lg"
                  >
                    Join
                  </button>
                </form>
                {newsletterMessage && (
                  <p className="mt-3 text-sm font-semibold text-emerald-700">✓ {newsletterMessage}</p>
                )}
              </div>
            </div>

            <div className="mt-8 border-t-2 border-white/40 pt-6 text-center text-sm text-slate-700">
              <p>&copy; 2026 Mangrove Guardian AI. Protecting mangroves for a sustainable future.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
