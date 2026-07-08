import React from "react";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Wrench,
  ClipboardList,
  Users,
  History,
  LogIn,
  CarFront
} from "lucide-react";
import "./Home.css"; 


import carImg from "../assets/img/Car.png";
import car2Img from "../assets/img/car2.png";
import insideImg from "../assets/img/inside.png";
import mechanicImg from "../assets/img/mechanic.png";
import mechanicThumbsImg from "../assets/img/mechanic-thumbs.png"

const features = [
  {
    Icon: ClipboardList,
    title: "Schedule Services",
    text: "License plate, model, customer, status and priority for every vehicle.",
  },
  {
    Icon: History,
    title: "Preventive maintenance",
    text: "Keep a clear record of every service performed in your workshop.",
  },
  {
    Icon: CarFront,
    title: "Repair tracking",
    text: "Follow each vehicle from check-in to diagnosis, repair and delivery.",
  },
  {
    Icon: Users,
    title: "Separated roles",
    text: "Admins manage the workshop, mechanics focus only on their assigned tasks.",
  }
];

const checklist = [
  "Create an admin account for your workshop.",
  "Register mechanics and give them access.",
  "Prepare the base for future repair tracking.",
  "Assign specific tasks to your staff."
];

export const Home = () => {

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    const { innerWidth, innerHeight } = window;
    const moveX = (e.clientX / innerWidth - 0.5) * 20;
    const moveY = (e.clientY / innerHeight - 0.5) * 20;
    setOffset({ x: moveX, y: moveY });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="container-fluid p-0">
      <section 
        className="hero-section position-relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div id="heroCarousel" className="carousel slide carousel-fade position-absolute w-100 h-100" data-bs-ride="carousel" data-bs-interval="4000">
          <div className="carousel-inner w-100 h-100"
            style={{
              transform: `scale(1.05) translate(${offset.x}px, ${offset.y}px)`,
              transition: "transform 0.3s ease-out" 
            }}
          >
            <div className="carousel-item active w-100 h-100">
              <img src={carImg} className="d-block w-100 h-100 object-fit-cover overlay-img" alt="Car" />
            </div>
            <div className="carousel-item w-100 h-100">
              <img src={car2Img} className="d-block w-100 h-100 object-fit-cover overlay-img" alt="Car 2" />
            </div>
            <div className="carousel-item w-100 h-100">
              <img src={insideImg} className="d-block w-100 h-100 object-fit-cover overlay-img" alt="Inside" />
            </div>
            <div className="carousel-item w-100 h-100">
              <img src={mechanicImg} className="d-block w-100 h-100 object-fit-cover overlay-img" alt="Mechanic" />
            </div>
          </div>
        </div>

        <div className="container py-5 position-relative z-1 hero-content d-flex align-items-center">
          <div className="row w-100">
            <div className="col-lg-8">
              <span className="badge bg-warning text-dark mb-3 d-inline-flex align-items-center gap-2">
                <Wrench size={16} />
                Workshop management app
              </span>

              <h1 className="display-4 fw-bold text-light">
                Manage your mechanic workshop <br />
                <span className="text-warning">without losing control</span>
              </h1>

              <p className="lead mt-3 text-light opacity-75">
                Register your workshop, create mechanic accounts and keep your team organized from one simple platform.
              </p>

              <div className="d-flex gap-3 mt-4 flex-wrap">
                <Link to="/register" className="btn btn-warning btn-lg fw-bold d-inline-flex align-items-center gap-2">
                  <Wrench size={20} />
                  Register my workshop
                </Link>

                <Link to="/login" className="btn btn-outline-light btn-lg d-inline-flex align-items-center gap-2">
                  <LogIn size={20} />
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-dark py-5">
        <div className="container text-center">
          <div className="d-flex justify-content-center mb-3">
            <div className="featured-title-wrapper">
              <h2 className="fw-bold mb-0 featured-title">FEATURED SERVICES</h2>
            </div>
          </div>
          
          <p className="text-muted mb-2">
            We offer great vehicle services for our customers round the clock.
          </p>

          <div className="row g-4 mt-2">
            {features.map((feature, index) => (
              <div className="col-md-6 col-lg-3" key={index}>
                <div className="feature-item p-3">
                  <div className="mb-4 text-warning">
                    <feature.Icon size={55} strokeWidth={1.5} />
                  </div>
                  <h5 className="fw-bold fs-6">{feature.title}</h5>
                  <p className="text-muted small lh-lg px-2">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="gradient-info-section position-relative overflow-hidden">
        <div className="container pt-5">
          <div className="row align-items-center">
            
            <div className="col-md-5 d-none d-md-flex align-items-end justify-content-center h-100 mt-auto">
              <img 
                src={mechanicThumbsImg}
                alt="Mechanic Thumbs Up" 
                className="img-fluid mechanic-hero-img" 
              />
            </div>
            
            <div className="col-md-7 py-5">
              <div className="d-flex justify-content-start mb-3">
                <div className="care-support-title-wrapper shadow-sm">
                  <h3 className="fw-bold mb-0 care-support-title">WHAT CAN YOU DO?</h3>
                </div>
              </div>
              
              <p className="text-white fw-semibold mb-5 fs-5">
                High quality and professional services
              </p>

              <div className="row g-4">
                {checklist.map((item, index) => (
                  <div className="col-md-6" key={index}>
                    <div className="d-flex align-items-start gap-3">
                      <span className="support-number fw-bold text-warning bg-white d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm">
                        {index + 1}
                      </span>
                      <div>
                        <h6 className="fw-bold text-white opacity-75 mb-1">
                          {item.split('.')[0]}.
                        </h6>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};