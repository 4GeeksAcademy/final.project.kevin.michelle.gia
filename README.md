# Repair Board 🔧

Repair Board is a full-stack workshop management application designed to help administrators and mechanics organize customers, vehicles, repairs, assignments, and service progress from one place.

The application was created as a collaborative final project during the 4Geeks Academy Full-Stack Development Bootcamp. This repository is my portfolio version of the project and includes later interface and functionality improvements.

## Main Features

- Authentication using JSON Web Tokens.
- Role-based access for administrators and mechanics.
- Customer and vehicle management.
- Creation and tracking of repair services.
- Visual service board organized by repair status.
- Assignment and reassignment of mechanics.
- Comments and image uploads for each service.
- Service history and status tracking.
- Responsive interface for managing daily workshop operations.

## User Roles

### Administrator

Administrators can:

- Create and manage customers and vehicles.
- Register new repair services.
- View all active services.
- Assign or reassign mechanics.
- Review service details, comments, images, and status changes.

### Mechanic

Mechanics can:

- View their assigned services.
- Claim available services.
- Update the status of a repair.
- Add comments and upload images.
- Review the information associated with each vehicle and service.

## Technologies

### Frontend

- React
- JavaScript
- Vite
- HTML
- CSS

### Backend

- Python
- Flask
- SQLAlchemy
- Flask-Migrate
- JWT authentication
- REST API

### Database and Services

- PostgreSQL
- Cloudinary
- Render
- Vercel

## Project Structure

The repository separates the main responsibilities of the frontend, backend, database, and documentation.

```text
repair-board/
├── src/              # Main application source code
├── public/           # Public assets and static files
├── Workshop API/     # Backend API and server-side resources
├── migrations/       # Database migration files
├── docs/             # Project documentation and supporting assets
├── dist/             # Production build files
├── README.md         # Main project documentation
└── README.es.md      # Spanish documentation
```

This organization keeps the interface, application logic, database management, and documentation separated, making the project easier to understand and maintain.

## Local Installation

### Requirements

Before starting, make sure you have installed:

- Python 3.10 or later
- Pipenv
- Node.js 20 or later
- PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/Sweetaxonomy/repair-board.git
cd repair-board
```

### 2. Install backend dependencies

```bash
pipenv install
```

### 3. Configure environment variables

Create a local `.env` file using `.env.example` as a reference:

```bash
cp .env.example .env
```

Add the required database, authentication, and Cloudinary credentials to the `.env` file.

Never upload your real `.env` file or private credentials to GitHub.

### 4. Run database migrations

```bash
pipenv run flask --app src/app.py db upgrade
```

### 5. Start the backend

```bash
pipenv run start
```

### 6. Install frontend dependencies

Open another terminal and run:

```bash
npm install
```

### 7. Start the frontend

```bash
npm run start
```

## Project Background

Repair Board was developed collaboratively as a final bootcamp project. The team worked on the database models, API endpoints, authentication, user roles, service-management workflow, and frontend interface.

This repository preserves the collaborative project history while serving as my personalized portfolio version.

## Future Improvements

- Improve automated testing.
- Add service notifications.
- Expand reporting and workshop statistics.
- Improve accessibility.
- Continue refining the mobile experience.

## Author

**Michelle Sirvent**

Junior Full-Stack Developer interested in creating useful, intuitive, and visually clear web applications.

Feel free to explore the repository and its development history.
