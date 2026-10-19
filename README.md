
# SafeServe – Smart Food Rescue & Community Support Platform

SafeServe is a web-based food rescue platform designed to reduce food waste by connecting food donors with NGOs and volunteers. It enables efficient donation management, preliminary food safety assessment, rescue coordination, and transparent pickup and delivery verification.

## 📌 Problem Statement

Large quantities of surplus food are wasted because donors and organizations in need often lack a centralized system for coordination. Manual tracking and limited verification can also reduce transparency and efficiency in food redistribution.

SafeServe addresses these challenges through a digital platform that simplifies food donation, user verification, rescue coordination, and delivery tracking.

## 🎯 Objectives

- Reduce food waste by connecting donors with NGOs and volunteers.
- Provide secure user registration and email OTP verification.
- Enable food donation submission and preliminary food safety assessment.
- Coordinate food pickup and delivery with QR, OTP, and GPS verification.
- Improve transparency through notifications, audit logs, and administrative monitoring.

## ✨ Key Features

### 1. Donor Management
- User registration and document submission.
- Email OTP verification.
- Submit surplus food donations with details and images.
- Track donation status and history.

### 2. Admin Management
- Verify users and review uploaded documents.
- Approve or reject registrations and food donations.
- Monitor rescue activities and platform statistics.
- Manage complaints, emergency requests, and audit records.

### 3. NGO Management
- View and accept suitable food donations.
- Coordinate volunteers for rescue activities.
- Confirm food receipt and delivery.
- Submit emergency food requirements.

### 4. Volunteer Management
- View and accept assigned rescue tasks.
- Verify pickup and delivery using QR codes, OTP, and GPS.
- Track assigned tasks and completed activities.

### 5. Food Safety Assessment
- Evaluate submitted food details using predefined rules.
- Consider preparation time, expiry, storage, and packaging conditions.
- Provide a preliminary safety assessment to support donation review.

### 6. Rescue Tracking and Verification
- Track the donation lifecycle from creation to distribution.
- Record pickup and delivery verification details.
- Maintain timestamps and available location information.
- Generate notifications and audit records for important activities.

## 🔄 Workflow

1. User registers and submits the required verification documents.
2. Email OTP verification is completed.
3. The administrator reviews and approves the account.
4. The donor submits surplus food details and an image.
5. The system performs a preliminary food safety assessment.
6. The administrator reviews and approves the donation.
7. A suitable NGO and volunteer are assigned.
8. Pickup is verified using QR, OTP, and GPS mechanisms.
9. The volunteer delivers the food to the NGO.
10. The NGO confirms receipt and completes the distribution process.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js, Express.js |
| Database | MongoDB / MongoDB Atlas |
| Authentication | JWT and bcrypt |
| Image Storage | Cloudinary |
| Email Notifications | Nodemailer |
| Location Services | GPS and mapping integration |
| Verification | QR codes and OTP |
| Development Tools | VS Code, Git, GitHub, Postman |

## 👥 Project Modules

| Module | Contributor |
|---|---|
| M1 – Donor Management | Somvanshi Pooja |
| M2 – Admin Management | Warkar Vaishnavi |
| M3 – NGO Management | Borale Samiksha |
| M4 – Volunteer Management | Gurli Palak |

## 🧪 Testing

The following functional test cases were completed successfully after fixing the email OTP configuration issue:

- Email OTP verification.
- Food donation submission with valid details.
- QR-, OTP-, and GPS-based pickup and delivery verification.
- User and donation approval workflows.
- NGO acceptance and donation lifecycle tracking.

Large-scale load testing and quantitative real-world impact measurement remain future work.

## 🌍 Real-World Impact

SafeServe aims to reduce avoidable food waste, improve coordination between donors and NGOs, and support transparent food redistribution through digital tracking and verification.

## 🚀 Future Scope

- Integrate IoT temperature and humidity sensors for real-time food storage monitoring.
- Use IoT-enabled devices to detect unsafe storage conditions.
- Introduce GPS-enabled IoT tracking for food transportation.
- Explore AI-based food demand prediction and advanced food safety analysis.
- Expand the platform for large-scale deployment with verified food rescue organizations.

## 🔐 Security

- Role-based access control for Donors, Admins, NGOs, and Volunteers.
- JWT-based authentication.
- Hashed passwords.
- Email OTP verification.
- Backend authorization and validation.
- Audit records for important platform activities.

## 📂 Project Structure

The exact directory structure may vary depending on the current project version. The project contains frontend and backend components, database integration, and supporting services.

## ⚙️ Installation and Setup

> The following is a general setup guide. Confirm the actual project directory structure and environment variable names before running the commands.

### Prerequisites
- Node.js and npm
- MongoDB or MongoDB Atlas account
- Git
- Required service credentials for email and image storage

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER>
```

### 2. Install Dependencies

Run `npm install` inside each project directory that contains a `package.json` file.

```bash
npm install
```

### 3. Configure Environment Variables

Create the required `.env` file based on the project's existing configuration. Typical settings may include:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Add any additional email, Cloudinary, or mapping credentials required by the implementation.

**Important:** Use your project's actual variable names and never commit real passwords, API keys, or secrets to GitHub.

### 4. Start the Application

Run the frontend and backend using the scripts specified in their respective `package.json` files.

```bash
npm run dev
```

The correct startup commands and ports depend on the project's current configuration.

## 📄 Project Status

SafeServe is a functional academic prototype with core donation, verification, and rescue workflows. IoT integration, large-scale performance testing, and advanced AI capabilities are proposed future enhancements.

## 📜 License

Add the appropriate license information for your project.

## 🙏 Acknowledgements

Developed as an academic project to explore technology-driven food rescue, waste reduction, and community support.
