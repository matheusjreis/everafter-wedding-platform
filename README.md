# EverAfter

EverAfter is a multi-tenant SaaS platform that allows couples to create and manage personalized wedding websites.

Each couple can create an account, customize their public website, share wedding details, upload photos, manage a symbolic gift registry, collect RSVP responses, and track payments made by their guests.

Guests can access the public wedding website without creating an account. They can view the wedding countdown, browse event details, open the venue location, confirm their attendance, select a gift, leave a personal message, and complete a payment using supported payment methods.

## Key Features

* Couple registration and authentication;
* Personalized wedding websites;
* Unique public URL for each wedding;
* Wedding countdown timer;
* Ceremony and reception details;
* Venue information and map integration;
* Photo gallery;
* Symbolic gift registry;
* Online payments through Pix and credit cards;
* RSVP management;
* Guest messages;
* Couple management dashboard;
* Platform administration dashboard;
* Payment and payout tracking;
* Customizable wedding themes;
* Mobile-first responsive design;
* Multi-tenant data isolation;
* Role-based access control;
* Secure payment webhook processing;
* Deployment on Vercel.

## User Roles

### Platform Administrator

Platform administrators can:

* Manage registered couples;
* Review published and unpublished websites;
* Suspend or reactivate accounts;
* Manage wedding templates;
* Monitor transactions and payouts;
* Configure platform fees and plans;
* Review webhook failures;
* Access audit logs and platform metrics.

### Couple

Couples can:

* Create and manage an account;
* Configure their wedding website;
* Add wedding dates, times, and locations;
* Customize colors, fonts, images, and sections;
* Upload photos;
* Create and manage a gift registry;
* Review RSVP responses;
* Track received gifts and payments;
* Manage payout information;
* Publish or unpublish their website.

Each couple can only access data belonging to their own account and wedding.

### Guest

Guests do not need an account to visit a public wedding website.

Guests can:

* View wedding information;
* Follow the wedding countdown;
* Browse the photo gallery;
* Open the venue location;
* Confirm their attendance;
* Browse the gift registry;
* Purchase a symbolic gift;
* Leave a personal message;
* Receive payment confirmation.

## Technology Stack

### Frontend

* React;
* Next.js;
* TypeScript;
* Tailwind CSS;
* shadcn/ui;
* React Hook Form;
* Zod.

### Backend and Database

* Supabase;
* PostgreSQL;
* Supabase Auth;
* Supabase Storage;
* Row Level Security;
* Next.js Server Actions and API routes.

### Payments

The platform is designed to integrate with a trusted payment provider that supports the Brazilian market.

The final provider will be selected based on support for:

* Pix;
* Credit cards;
* Secure hosted checkout or tokenization;
* Payment webhooks;
* Refunds;
* Chargebacks;
* Connected accounts or subaccounts;
* Platform fees;
* Payouts;
* Identity verification and KYC requirements.

The application does not store complete credit card details.

### Infrastructure

* Vercel;
* Supabase Cloud;
* Environment-based configuration;
* Version-controlled database migrations;
* Automated testing and deployment workflows.

## Architecture

EverAfter follows a multi-tenant architecture. Multiple couples can use the same platform while their accounts, wedding websites, guests, gifts, payments, and files remain fully isolated.

Tenant isolation is enforced through:

* Supabase authentication;
* PostgreSQL Row Level Security policies;
* Server-side authorization;
* Role-based access control;
* Secure storage policies;
* Input validation;
* Automated authorization tests.

Sensitive operations are always validated on the server. Client-provided identifiers, prices, payment statuses, and ownership information are never considered trusted.

## Payment Flow

The gift registry contains symbolic gifts. Guests select a gift, while the couple receives the corresponding monetary value after payment provider fees and any applicable platform commission.

The expected payment flow is:

1. A guest selects a gift;
2. The backend retrieves the official price from the database;
3. A payment is created through the selected provider;
4. The guest completes the payment;
5. The provider sends a signed webhook;
6. The backend validates and processes the event;
7. The transaction is updated idempotently;
8. The gift appears in the couple's dashboard;
9. The guest receives a confirmation;
10. The platform records the gross amount, provider fee, platform fee, net amount, and payout status.

Repeated webhook events must never create duplicate gifts, transactions, or credits.

## Mobile-First Experience

EverAfter is designed with a mobile-first approach because most guests are expected to access wedding websites through links shared on WhatsApp or social media.

All public and administrative pages are optimized for:

* Smartphones;
* Tablets;
* Desktop devices;
* Touch interaction;
* Mobile checkout;
* Pix payments;
* Accessible navigation;
* Responsive images;
* Modern mobile browsers.

The main flows are tested across multiple viewport sizes, starting at 320 pixels wide.

## Security

Security is treated as a core product requirement.

The platform includes:

* Multi-tenant data isolation;
* Row Level Security;
* Server-side authorization;
* Role-based permissions;
* Secure authentication flows;
* Payment webhook signature validation;
* Idempotent financial operations;
* Rate limiting;
* Input validation and sanitization;
* Secure file upload policies;
* Audit logging;
* Secret management through environment variables;
* Protection against common OWASP vulnerabilities;
* Automated security and authorization tests.

No sensitive credentials or private API keys are exposed to the browser.

## Privacy

The platform is designed with privacy and LGPD principles in mind, including:

* Data minimization;
* Purpose-based data collection;
* Account deletion workflows;
* Personal data export;
* Configurable data retention;
* Guest data protection;
* Secure storage;
* Auditability of administrative operations.

## Project Status

EverAfter is currently under development.

The initial MVP includes:

* Couple registration and authentication;
* Wedding website creation;
* Public wedding pages;
* Countdown timer;
* Event and venue details;
* Photo gallery;
* Gift registry;
* RSVP management;
* Payment integration;
* Couple dashboard;
* Basic platform administration;
* Multi-tenant data isolation;
* Responsive mobile experience;
* Vercel deployment.

## Future Improvements

* Multiple wedding templates;
* Custom domains;
* Subscription plans;
* Advanced website editor;
* Multiple managers per wedding;
* Email notifications;
* WhatsApp integration;
* Collaborative photo albums;
* Digital guestbook;
* Advanced guest management;
* Analytics and financial reports;
* International payment methods;
* Multiple languages and currencies.

## Getting Started

Installation, environment configuration, database setup, migrations, and local development instructions will be added as the implementation evolves.

## Disclaimer

EverAfter is a portfolio project currently under development. Payment processing features must use official provider APIs, comply with provider requirements, and follow all applicable financial, privacy, and security regulations.
