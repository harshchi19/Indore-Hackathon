"""
Neo4j Dense Graph Seeder - 10K+ Nodes
Creates realistic dummy data for Verdant Energy Platform

Node Types:
- User (~2000 consumers)
- Producer (~500 energy producers)
- EnergyListing (~3000 listings)
- Contract (~2500 contracts)
- Transaction (~2000 transactions)
- Certificate (~1000 green certificates)

Relationships:
- User -[:INTERESTED_IN]-> Producer
- User -[:HAS_CONTRACT]-> Producer
- User -[:PURCHASED]-> EnergyListing
- User -[:OWNS_CERTIFICATE]-> Certificate
- Producer -[:OFFERS]-> EnergyListing
- Producer -[:ISSUED]-> Certificate
- Transaction -[:FOR_CONTRACT]-> Contract
- User -[:SIMILAR_TO]-> User (for recommendations)
- Producer -[:COMPETES_WITH]-> Producer
"""

import random
import uuid
from datetime import datetime, timedelta
from neo4j import GraphDatabase

# Connection settings
URI = "neo4j+s://00978a83.databases.neo4j.io"
USERNAME = "00978a83"
PASSWORD = "brhOYjozOJOaVBJA0cl8OuwaoKKEvOEvk11toDLxTjY"
DATABASE = "00978a83"

# Indian names for realistic data
FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
    "Ananya", "Diya", "Priya", "Aadhya", "Saanvi", "Aanya", "Pari", "Myra", "Sara", "Ira",
    "Rahul", "Amit", "Raj", "Vikram", "Suresh", "Mahesh", "Deepak", "Arun", "Kiran", "Vijay",
    "Neha", "Pooja", "Sneha", "Kavita", "Sunita", "Rekha", "Meera", "Lakshmi", "Anjali", "Divya",
    "Rohan", "Kunal", "Nikhil", "Sanjay", "Manish", "Gaurav", "Ravi", "Ajay", "Bhavesh", "Chirag"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Singh", "Kumar", "Gupta", "Agarwal", "Jain", "Shah", "Mehta",
    "Reddy", "Rao", "Nair", "Menon", "Iyer", "Pillai", "Das", "Ghosh", "Bose", "Sen",
    "Chauhan", "Yadav", "Pandey", "Mishra", "Dubey", "Tiwari", "Srivastava", "Saxena", "Malhotra", "Kapoor"
]

CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad",
    "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam",
    "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut",
    "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Allahabad", "Ranchi"
]

STATES = [
    "Maharashtra", "Karnataka", "Tamil Nadu", "Telangana", "Gujarat", "Rajasthan",
    "Uttar Pradesh", "West Bengal", "Madhya Pradesh", "Kerala", "Punjab", "Haryana"
]

ENERGY_TYPES = ["solar", "wind", "hydro", "biomass", "geothermal"]
ENERGY_WEIGHTS = [0.4, 0.3, 0.15, 0.1, 0.05]  # Solar and wind more common

PRODUCER_PREFIXES = ["Green", "Eco", "Solar", "Wind", "Hydro", "Clean", "Renewable", "Sustainable", "Pure", "Natural"]
PRODUCER_SUFFIXES = ["Energy", "Power", "Solutions", "Systems", "Farm", "Plant", "Hub", "Grid", "Station", "Works"]

CONTRACT_STATUSES = ["active", "completed", "pending", "cancelled"]
TRANSACTION_TYPES = ["purchase", "sale", "transfer", "refund"]
CERTIFICATE_TYPES = ["REC", "GO", "I-REC", "TIGR", "Green-e"]


def generate_users(count=2000):
    """Generate consumer users"""
    users = []
    for i in range(count):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        city = random.choice(CITIES)
        users.append({
            "id": f"user-{i+1:05d}",
            "name": f"{first} {last}",
            "email": f"{first.lower()}.{last.lower()}{i}@gmail.com",
            "role": "consumer",
            "city": city,
            "state": random.choice(STATES),
            "energy_preference": random.choice(ENERGY_TYPES),
            "monthly_consumption_kwh": random.randint(100, 2000),
            "budget_per_kwh": round(random.uniform(3.0, 8.0), 2),
            "green_score": round(random.uniform(0.1, 1.0), 2),
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 730))).isoformat()
        })
    return users


def generate_producers(count=500):
    """Generate energy producers"""
    producers = []
    for i in range(count):
        energy_type = random.choices(ENERGY_TYPES, weights=ENERGY_WEIGHTS)[0]
        prefix = random.choice(PRODUCER_PREFIXES)
        suffix = random.choice(PRODUCER_SUFFIXES)
        city = random.choice(CITIES)
        
        producers.append({
            "id": f"producer-{i+1:04d}",
            "name": f"{prefix} {suffix} {city[:3].upper()}-{i+1}",
            "energy_type": energy_type,
            "capacity_kw": random.randint(100, 10000),
            "available_kw": random.randint(50, 5000),
            "price_per_kwh": round(random.uniform(2.5, 7.0), 2),
            "location": city,
            "state": random.choice(STATES),
            "rating": round(random.uniform(3.0, 5.0), 1),
            "total_sales_mwh": random.randint(100, 50000),
            "reliability_score": round(random.uniform(0.7, 1.0), 2),
            "carbon_offset_tons": random.randint(10, 5000),
            "verified": random.random() > 0.2,
            "created_at": (datetime.now() - timedelta(days=random.randint(30, 1095))).isoformat()
        })
    return producers


def generate_listings(producers, count=3000):
    """Generate energy listings"""
    listings = []
    for i in range(count):
        producer = random.choice(producers)
        quantity = random.randint(10, 500)
        price = producer["price_per_kwh"] * random.uniform(0.9, 1.1)
        
        listings.append({
            "id": f"listing-{i+1:05d}",
            "producer_id": producer["id"],
            "energy_type": producer["energy_type"],
            "quantity_kwh": quantity,
            "price_per_kwh": round(price, 2),
            "total_price": round(quantity * price, 2),
            "status": random.choice(["available", "sold", "reserved", "expired"]),
            "min_purchase_kwh": random.randint(5, 50),
            "delivery_date": (datetime.now() + timedelta(days=random.randint(1, 30))).isoformat(),
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat()
        })
    return listings


def generate_contracts(users, producers, count=2500):
    """Generate contracts between users and producers"""
    contracts = []
    for i in range(count):
        user = random.choice(users)
        producer = random.choice(producers)
        energy_amount = random.randint(100, 2000)
        duration_months = random.choice([3, 6, 12, 24])
        
        contracts.append({
            "id": f"contract-{i+1:05d}",
            "user_id": user["id"],
            "producer_id": producer["id"],
            "energy_amount_kwh": energy_amount,
            "price_per_kwh": producer["price_per_kwh"],
            "total_value": round(energy_amount * producer["price_per_kwh"], 2),
            "duration_months": duration_months,
            "status": random.choices(CONTRACT_STATUSES, weights=[0.5, 0.3, 0.15, 0.05])[0],
            "start_date": (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
            "end_date": (datetime.now() + timedelta(days=random.randint(30, 365))).isoformat(),
            "auto_renew": random.random() > 0.5
        })
    return contracts


def generate_transactions(users, contracts, count=2000):
    """Generate transactions"""
    transactions = []
    for i in range(count):
        user = random.choice(users)
        contract = random.choice(contracts)
        amount = round(random.uniform(100, 10000), 2)
        
        transactions.append({
            "id": f"txn-{i+1:06d}",
            "user_id": user["id"],
            "contract_id": contract["id"],
            "amount_inr": amount,
            "energy_kwh": round(amount / random.uniform(3, 6), 2),
            "type": random.choice(TRANSACTION_TYPES),
            "status": random.choice(["completed", "pending", "failed"]),
            "payment_method": random.choice(["UPI", "card", "netbanking", "wallet"]),
            "timestamp": (datetime.now() - timedelta(days=random.randint(1, 180))).isoformat()
        })
    return transactions


def generate_certificates(users, producers, count=1000):
    """Generate green energy certificates"""
    certificates = []
    for i in range(count):
        user = random.choice(users)
        producer = random.choice(producers)
        
        certificates.append({
            "id": f"cert-{i+1:05d}",
            "user_id": user["id"],
            "producer_id": producer["id"],
            "type": random.choice(CERTIFICATE_TYPES),
            "energy_kwh": random.randint(100, 5000),
            "carbon_offset_kg": random.randint(50, 2500),
            "issue_date": (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
            "expiry_date": (datetime.now() + timedelta(days=random.randint(180, 730))).isoformat(),
            "verified": random.random() > 0.1
        })
    return certificates


def batch_create_nodes(session, label, nodes, batch_size=500):
    """Create nodes in batches"""
    total = len(nodes)
    for i in range(0, total, batch_size):
        batch = nodes[i:i+batch_size]
        session.run(f"""
            UNWIND $nodes AS node
            CREATE (n:{label})
            SET n = node
        """, nodes=batch)
        print(f"  Created {min(i+batch_size, total)}/{total} {label} nodes")


def create_relationships(session, users, producers, listings, contracts, certificates):
    """Create all relationships"""
    
    # 1. User -[:INTERESTED_IN]-> Producer (based on energy preference)
    print("\nCreating INTERESTED_IN relationships...")
    for energy_type in ENERGY_TYPES:
        session.run("""
            MATCH (u:User {energy_preference: $energy_type})
            MATCH (p:Producer {energy_type: $energy_type})
            WHERE rand() < 0.3
            CREATE (u)-[:INTERESTED_IN {
                score: rand(),
                reason: 'energy_preference_match',
                created_at: datetime()
            }]->(p)
        """, energy_type=energy_type)
    
    # 2. Producer -[:OFFERS]-> EnergyListing
    print("Creating OFFERS relationships...")
    session.run("""
        MATCH (p:Producer), (l:EnergyListing)
        WHERE p.id = l.producer_id
        CREATE (p)-[:OFFERS]->(l)
    """)
    
    # 3. User -[:HAS_CONTRACT]-> Producer (from contracts data)
    print("Creating HAS_CONTRACT relationships...")
    session.run("""
        MATCH (u:User), (c:Contract), (p:Producer)
        WHERE u.id = c.user_id AND p.id = c.producer_id
        CREATE (u)-[:HAS_CONTRACT {
            contract_id: c.id,
            energy_kwh: c.energy_amount_kwh,
            value_inr: c.total_value,
            status: c.status
        }]->(p)
    """)
    
    # 4. Transaction -[:FOR_CONTRACT]-> Contract
    print("Creating FOR_CONTRACT relationships...")
    session.run("""
        MATCH (t:Transaction), (c:Contract)
        WHERE t.contract_id = c.id
        CREATE (t)-[:FOR_CONTRACT]->(c)
    """)
    
    # 5. User -[:MADE_TRANSACTION]-> Transaction
    print("Creating MADE_TRANSACTION relationships...")
    session.run("""
        MATCH (u:User), (t:Transaction)
        WHERE u.id = t.user_id
        CREATE (u)-[:MADE_TRANSACTION]->(t)
    """)
    
    # 6. User -[:OWNS_CERTIFICATE]-> Certificate
    print("Creating OWNS_CERTIFICATE relationships...")
    session.run("""
        MATCH (u:User), (cert:Certificate)
        WHERE u.id = cert.user_id
        CREATE (u)-[:OWNS_CERTIFICATE]->(cert)
    """)
    
    # 7. Producer -[:ISSUED]-> Certificate
    print("Creating ISSUED relationships...")
    session.run("""
        MATCH (p:Producer), (cert:Certificate)
        WHERE p.id = cert.producer_id
        CREATE (p)-[:ISSUED]->(cert)
    """)
    
    # 8. User -[:SIMILAR_TO]-> User (for collaborative filtering)
    print("Creating SIMILAR_TO relationships (collaborative filtering)...")
    session.run("""
        MATCH (u1:User), (u2:User)
        WHERE u1.id < u2.id 
            AND u1.energy_preference = u2.energy_preference
            AND u1.city = u2.city
            AND rand() < 0.05
        CREATE (u1)-[:SIMILAR_TO {
            similarity_score: rand(),
            common_preferences: [u1.energy_preference]
        }]->(u2)
    """)
    
    # 9. Producer -[:COMPETES_WITH]-> Producer (same energy type, same state)
    print("Creating COMPETES_WITH relationships...")
    session.run("""
        MATCH (p1:Producer), (p2:Producer)
        WHERE p1.id < p2.id 
            AND p1.energy_type = p2.energy_type
            AND p1.state = p2.state
            AND rand() < 0.3
        CREATE (p1)-[:COMPETES_WITH {
            competition_level: rand()
        }]->(p2)
    """)
    
    # 10. User -[:VIEWED]-> Producer (browsing history simulation)
    print("Creating VIEWED relationships (browsing history)...")
    session.run("""
        MATCH (u:User), (p:Producer)
        WHERE rand() < 0.02
        CREATE (u)-[:VIEWED {
            view_count: toInteger(rand() * 10) + 1,
            last_viewed: datetime() - duration({days: toInteger(rand() * 30)})
        }]->(p)
    """)
    
    # 11. User -[:PURCHASED]-> EnergyListing
    print("Creating PURCHASED relationships...")
    session.run("""
        MATCH (u:User), (l:EnergyListing {status: 'sold'})
        WHERE rand() < 0.05
        CREATE (u)-[:PURCHASED {
            purchase_date: datetime() - duration({days: toInteger(rand() * 90)}),
            quantity_kwh: l.quantity_kwh
        }]->(l)
    """)


def create_indexes(session):
    """Create indexes for better query performance"""
    print("\nCreating indexes...")
    indexes = [
        "CREATE INDEX user_id IF NOT EXISTS FOR (u:User) ON (u.id)",
        "CREATE INDEX user_city IF NOT EXISTS FOR (u:User) ON (u.city)",
        "CREATE INDEX user_energy_pref IF NOT EXISTS FOR (u:User) ON (u.energy_preference)",
        "CREATE INDEX producer_id IF NOT EXISTS FOR (p:Producer) ON (p.id)",
        "CREATE INDEX producer_type IF NOT EXISTS FOR (p:Producer) ON (p.energy_type)",
        "CREATE INDEX producer_location IF NOT EXISTS FOR (p:Producer) ON (p.location)",
        "CREATE INDEX listing_id IF NOT EXISTS FOR (l:EnergyListing) ON (l.id)",
        "CREATE INDEX listing_status IF NOT EXISTS FOR (l:EnergyListing) ON (l.status)",
        "CREATE INDEX contract_id IF NOT EXISTS FOR (c:Contract) ON (c.id)",
        "CREATE INDEX contract_status IF NOT EXISTS FOR (c:Contract) ON (c.status)",
        "CREATE INDEX transaction_id IF NOT EXISTS FOR (t:Transaction) ON (t.id)",
        "CREATE INDEX certificate_id IF NOT EXISTS FOR (cert:Certificate) ON (cert.id)",
    ]
    for idx in indexes:
        try:
            session.run(idx)
        except Exception as e:
            pass  # Index might already exist
    print("  Indexes created")


def get_stats(session):
    """Get graph statistics"""
    print("\n" + "="*60)
    print("GRAPH STATISTICS")
    print("="*60)
    
    # Node counts
    result = session.run("""
        MATCH (n)
        RETURN labels(n)[0] as label, count(*) as count
        ORDER BY count DESC
    """)
    print("\nNode Counts:")
    total_nodes = 0
    for record in result:
        print(f"  {record['label']:20} : {record['count']:,}")
        total_nodes += record['count']
    print(f"  {'TOTAL':20} : {total_nodes:,}")
    
    # Relationship counts
    result = session.run("""
        MATCH ()-[r]->()
        RETURN type(r) as type, count(*) as count
        ORDER BY count DESC
    """)
    print("\nRelationship Counts:")
    total_rels = 0
    for record in result:
        print(f"  {record['type']:20} : {record['count']:,}")
        total_rels += record['count']
    print(f"  {'TOTAL':20} : {total_rels:,}")
    
    print("\n" + "="*60)
    print(f"TOTAL GRAPH SIZE: {total_nodes:,} nodes, {total_rels:,} relationships")
    print("="*60)


def clear_database(session):
    """Clear all existing data"""
    print("Clearing existing data...")
    session.run("MATCH (n) DETACH DELETE n")
    print("  Database cleared")


def main():
    print("="*60)
    print("VERDANT ENERGY PLATFORM - Neo4j Graph Seeder")
    print("Creating 10K+ nodes with dense relationships")
    print("="*60)
    
    # Generate all data
    print("\n[1/7] Generating Users...")
    users = generate_users(2000)
    print(f"  Generated {len(users)} users")
    
    print("\n[2/7] Generating Producers...")
    producers = generate_producers(500)
    print(f"  Generated {len(producers)} producers")
    
    print("\n[3/7] Generating Energy Listings...")
    listings = generate_listings(producers, 3000)
    print(f"  Generated {len(listings)} listings")
    
    print("\n[4/7] Generating Contracts...")
    contracts = generate_contracts(users, producers, 2500)
    print(f"  Generated {len(contracts)} contracts")
    
    print("\n[5/7] Generating Transactions...")
    transactions = generate_transactions(users, contracts, 2000)
    print(f"  Generated {len(transactions)} transactions")
    
    print("\n[6/7] Generating Certificates...")
    certificates = generate_certificates(users, producers, 1000)
    print(f"  Generated {len(certificates)} certificates")
    
    # Connect to Neo4j
    print("\n[7/7] Connecting to Neo4j Aura...")
    driver = GraphDatabase.driver(URI, auth=(USERNAME, PASSWORD))
    
    with driver.session(database=DATABASE) as session:
        # Clear existing data
        clear_database(session)
        
        # Create indexes first
        create_indexes(session)
        
        # Create nodes
        print("\nCreating nodes...")
        batch_create_nodes(session, "User", users)
        batch_create_nodes(session, "Producer", producers)
        batch_create_nodes(session, "EnergyListing", listings)
        batch_create_nodes(session, "Contract", contracts)
        batch_create_nodes(session, "Transaction", transactions)
        batch_create_nodes(session, "Certificate", certificates)
        
        # Create relationships
        print("\nCreating relationships...")
        create_relationships(session, users, producers, listings, contracts, certificates)
        
        # Show statistics
        get_stats(session)
    
    driver.close()
    print("\n✓ Graph seeding completed successfully!")


if __name__ == "__main__":
    main()
