# Supabase Database Schema Documentation

## Overview
This document describes the database structure for the DomGo real estate mobile application. The database is hosted on Supabase and consists of 5 main tables with established relationships.

## Database Tables

### 1. users
**Purpose**: Store user authentication and profile information

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | string | Primary key, UUID | PRIMARY KEY |
| created_at | string | Account creation timestamp | NOT NULL |
| email | string | User email address | NOT NULL, UNIQUE |
| name | string \| null | User's display name | Optional |
| phone | string \| null | User's phone number | Optional |
| avatar_url | string \| null | URL to user's profile picture | Optional |
| is_agency | boolean | Whether user represents an agency | Default: false |

**Relationships**: 
- One-to-one with `agency_profiles` (if is_agency = true)
- One-to-many with `properties` (user can create multiple properties)
- One-to-many with `favorites` (user can favorite multiple properties)

### 2. cities
**Purpose**: Store location data for properties

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | number | Primary key, auto-increment | PRIMARY KEY |
| name | string | City name | NOT NULL |
| coordinates | Json | Geographic coordinates | Optional |
| created_at | string | Record creation timestamp | NOT NULL |

**Relationships**:
- One-to-many with `properties` (city can have multiple properties)

### 3. properties
**Purpose**: Core table storing real estate listings

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | string | Primary key, UUID | PRIMARY KEY |
| created_at | string | Property creation timestamp | NOT NULL |
| title | string | Property title/headline | NOT NULL |
| description | string | Detailed property description | NOT NULL |
| type | string | 'sale' or 'rent' | NOT NULL |
| property_type | string | 'apartment', 'house', 'commercial', etc. | NOT NULL |
| price | number | Property price in local currency | NOT NULL |
| area | number | Property area in square meters | NOT NULL |
| rooms | number | Number of rooms | NOT NULL |
| location | string | Address or location description | NOT NULL |
| city_id | number \| null | Reference to cities table | FOREIGN KEY |
| images | string[] | Array of image URLs | Default: [] |
| features | string[] \| null | Array of property features | Optional |
| coordinates | Json \| null | Geographic coordinates | Optional |
| status | string \| null | 'active', 'sold', 'rented' | Optional |
| user_id | string \| null | Owner/creator of the property | FOREIGN KEY |
| agency_id | string \| null | Associated agency (if any) | FOREIGN KEY |

**Relationships**:
- Many-to-one with `users` (property belongs to a user)
- Many-to-one with `cities` (property located in a city)
- Many-to-one with `agency_profiles` (property may belong to an agency)
- One-to-many with `favorites` (property can be favorited by multiple users)

### 4. agency_profiles
**Purpose**: Store real estate agency information

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | string | Primary key, UUID | PRIMARY KEY |
| created_at | string | Profile creation timestamp | NOT NULL |
| user_id | string | Reference to users table | FOREIGN KEY, UNIQUE |
| name | string | Agency name | NOT NULL |
| phone | string \| null | Agency contact phone | Optional |
| email | string \| null | Agency contact email | Optional |
| location | string \| null | Agency physical address | Optional |
| logo_url | string \| null | URL to agency logo | Optional |
| description | string \| null | Agency description | Optional |
| site | string \| null | Agency website URL | Optional |

**Relationships**:
- One-to-one with `users` (agency profile belongs to one user)
- One-to-many with `properties` (agency can have multiple properties)

### 5. favorites
**Purpose**: Track user's favorite properties

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | string | Primary key, UUID | PRIMARY KEY |
| created_at | string | Favorite creation timestamp | NOT NULL |
| user_id | string | Reference to users table | FOREIGN KEY |
| property_id | string | Reference to properties table | FOREIGN KEY |

**Relationships**:
- Many-to-one with `users` (favorite belongs to a user)
- Many-to-one with `properties` (favorite references a property)

**Constraints**: 
- Unique combination of (user_id, property_id) prevents duplicate favorites

## Database Relationships Diagram

```
users (1) ←→ (0..1) agency_profiles
  ↓ (1)
  ↓
  ↓ (0..*)
properties (0..*) ←→ (1) cities
  ↓ (1)
  ↓
  ↓ (0..*)
favorites (0..*) ←→ (1) users
```

## Key Features

### Authentication & Authorization
- Users authenticate via Supabase Auth
- Row Level Security (RLS) policies control data access
- Users can only modify their own properties and profiles

### Property Management
- Properties support both sale and rental listings
- Flexible property types (apartment, house, commercial, land)
- Image storage via Supabase Storage
- Geographic coordinates for mapping
- Feature tags for property amenities

### Agency Support
- Users can create agency profiles
- Agency properties are associated with both user and agency
- Agency branding and contact information

### User Experience
- Favorites system for saved properties
- City-based property filtering
- Property status tracking (active, sold, rented)

## Data Types Used

- **string**: Text data, UUIDs, timestamps
- **number**: Numeric data (prices, areas, room counts)
- **boolean**: True/false flags
- **string[]**: Arrays for images and features
- **Json**: Flexible data for coordinates and other structured data
- **null**: Optional fields that can be empty

## Indexing Strategy

Key indexes for performance:
- `properties.type` - For filtering by sale/rent
- `properties.city_id` - For location-based queries
- `properties.user_id` - For user's property listings
- `properties.agency_id` - For agency property listings
- `favorites.user_id` - For user's favorite properties
- `properties.status` - For filtering active/sold/rented properties

## Migration Considerations

When updating the schema:
1. Always use Supabase migrations
2. Test changes in development environment first
3. Update TypeScript types using `supabase gen types typescript`
4. Ensure RLS policies are updated accordingly
5. Update API endpoints and client code as needed