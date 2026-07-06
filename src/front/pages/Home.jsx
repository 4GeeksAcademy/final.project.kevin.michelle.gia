import React from "react";
import { Link } from "react-router-dom";
import {
  Wrench,
  Car,
  Gauge,
  Disc,
  ClipboardList,
  Users,
  Route,
  History,
  Check,
  LogIn,
  ArrowRight,
} from "lucide-react";


const workshopGallery = [
  { title: "Engine diagnostics", Icon: Gauge, img: "/workshop/engine.jpg" },
  { title: "Tools & maintenance", Icon: Wrench, img: "/workshop/tools.jpg" },
  { title: "Tires & brakes", Icon: Disc, img: "/workshop/tires.jpg" },
  { title: "Expert service", Icon: Car, img: "/workshop/service.jpg" },
];

const features = [
  {
    Icon: ClipboardList,
    title: "Vehicle records",
    text: "License plate, model, customer, status and priority for every vehicle.",
  },
  {
    Icon: Users,
    title: "Separated roles",
    text: "Admins manage the workshop, mechanics focus only on their assigned tasks.",
  },
  {
    Icon: Route,
    title: "Repair tracking",
    text: "Follow each vehicle from check-in to diagnosis, repair and delivery.",
  },
  {
    Icon: History,
    title: "Service history",
    text: "Keep a clear record of every service performed in your workshop.",
  },
];

const checklist = [
  "Create an admin account for your workshop.",
  "Register mechanics and give them access.",
  "Prepare the base for future repair tracking.",
];

export const Home = () => {
  return (
    <div className="container-fluid p-0">

     
      <section
        className="bg-dark text-light py-5 position-relative"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,15,15,.85), rgba(15,15,15,.93)), url('/workshop/hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <span className="badge bg-warning text-dark mb-3 d-inline-flex align-items-center gap-2">
                <Wrench size={16} />
                Workshop management app
              </span>

              <h1 className="display-4 fw-bold">
                Manage your mechanic workshop <br />
                <span className="text-warning">without losing control</span>
              </h1>

              <p className="lead mt-3 text-light opacity-75">
                Register your workshop, create mechanic accounts and keep your team organized from one simple platform.
              </p>

              <div className="d-flex gap-3 mt-4 flex-wrap">
                <Link
                  to="/register"
                  className="btn btn-warning btn-lg fw-bold d-inline-flex align-items-center gap-2"
                >
                  <Wrench size={20} />
                  Register my workshop
                </Link>

                <Link
                  to="/login"
                  className="btn btn-outline-light btn-lg d-inline-flex align-items-center gap-2"
                >
                  <LogIn size={20} />
                  Sign in
                </Link>
              </div>
            </div>

            <div className="col-lg-5 mt-5 mt-lg-0">
              <div className="card border-0 shadow-lg">
                <div className="card-body p-4">
                  <h2 className="h5 fw-bold mb-3 text-dark">
                    What can you do?
                  </h2>

                  <div className="d-flex flex-column gap-3">
                    {checklist.map((item, index) => (
                      <div className="d-flex align-items-center gap-3" key={index}>
                        <span
                          className="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning text-dark"
                          style={{ width: 32, height: 32, flexShrink: 0 }}
                        >
                          <Check size={18} strokeWidth={3} />
                        </span>
                        <p className="mb-0 text-muted">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

     
      <section className="bg-dark pb-5">
        <div className="container">
          <div className="row g-3 g-md-4">
            {workshopGallery.map((item, index) => (
              <div className="col-6 col-lg-3" key={index}>
                <div className="rounded-3 overflow-hidden shadow-sm border border-secondary border-opacity-25">
                  <div
                    className="position-relative bg-black d-flex align-items-center justify-content-center"
                    style={{ aspectRatio: "4 / 3" }}
                  >
                    
                    <item.Icon size={46} className="text-warning opacity-50 position-absolute" />

                   
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-100 h-100 position-relative"
                      style={{ objectFit: "cover" }}
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />

                  
                    <div
                      className="position-absolute bottom-0 start-0 end-0 p-2 d-flex align-items-center gap-2"
                      style={{ background: "linear-gradient(transparent, rgba(0,0,0,.85))" }}
                    >
                      <item.Icon size={18} className="text-warning" />
                      <span className="text-light small fw-semibold">{item.title}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

     
      <section className="container py-5">
        <h2 className="text-center fw-bold mb-2 d-inline-flex align-items-center justify-content-center gap-2 w-100">
          <Wrench size={26} className="text-warning" />
          What does AppTalleres include?
        </h2>

        <p className="text-center text-muted mb-5">
          A simple MVP to organize workshop users, roles and team access.
        </p>

        <div className="row g-4">
          {features.map((feature, index) => (
            <div className="col-md-6 col-lg-3" key={index}>
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning text-dark mb-3"
                    style={{ width: 64, height: 64 }}
                  >
                    <feature.Icon size={30} />
                  </div>
                  <h5 className="mt-2 fw-bold">{feature.title}</h5>
                  <p className="text-muted small">{feature.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

     
      <section className="bg-warning py-5">
        <div className="container text-center">
          <h2 className="fw-bold d-inline-flex align-items-center gap-2">
            <Car size={30} />
            Ready to get started?
          </h2>
          <p className="lead">
            Register your workshop in less than two minutes.
          </p>

          <Link
            to="/register"
            className="btn btn-dark btn-lg fw-bold d-inline-flex align-items-center gap-2"
          >
            Create free account
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

    </div>
  );
};