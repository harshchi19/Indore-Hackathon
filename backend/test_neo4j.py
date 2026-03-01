"""
Neo4j Connection Test Script
Run: python test_neo4j.py
"""
from neo4j import GraphDatabase

# Connection settings
uri = "neo4j+s://00978a83.databases.neo4j.io"
username = "00978a83"
password = "brhOYjozOJOaVBJA0cl8OuwaoKKEvOEvk11toDLxTjY"
database = "00978a83"

def main():
    print("Connecting to Neo4j Aura...")
    driver = GraphDatabase.driver(uri, auth=(username, password))
    
    with driver.session(database=database) as session:
        # 1. Create a test User node
        print("\n1. Creating User node...")
        result = session.run("""
            CREATE (u:User {
                id: 'test-user-1', 
                name: 'Rahul Sharma', 
                email: 'rahul@verdant.com', 
                role: 'consumer',
                location: 'Mumbai'
            })
            RETURN u.name as name
        """)
        record = result.single()
        print(f"   Created User: {record['name']}")
        
        # 2. Create a Producer node
        print("\n2. Creating Producer node...")
        result = session.run("""
            CREATE (p:Producer {
                id: 'test-producer-1', 
                name: 'Solar Farm Alpha', 
                energy_type: 'solar', 
                capacity_kw: 500,
                location: 'Rajasthan',
                price_per_kwh: 4.5
            })
            RETURN p.name as name
        """)
        record = result.single()
        print(f"   Created Producer: {record['name']}")
        
        # 3. Create another Producer
        print("\n3. Creating Wind Farm...")
        result = session.run("""
            CREATE (p:Producer {
                id: 'test-producer-2', 
                name: 'Wind Farm Beta', 
                energy_type: 'wind', 
                capacity_kw: 800,
                location: 'Gujarat',
                price_per_kwh: 3.8
            })
            RETURN p.name as name
        """)
        record = result.single()
        print(f"   Created Producer: {record['name']}")
        
        # 4. Create relationships
        print("\n4. Creating INTERESTED_IN relationship...")
        result = session.run("""
            MATCH (u:User {id: 'test-user-1'}), (p:Producer {id: 'test-producer-1'})
            CREATE (u)-[r:INTERESTED_IN {score: 0.85, created_at: datetime()}]->(p)
            RETURN u.name as user, p.name as producer
        """)
        record = result.single()
        print(f"   {record['user']} --INTERESTED_IN--> {record['producer']}")
        
        # 5. Create a contract relationship
        print("\n5. Creating HAS_CONTRACT relationship...")
        result = session.run("""
            MATCH (u:User {id: 'test-user-1'}), (p:Producer {id: 'test-producer-2'})
            CREATE (u)-[r:HAS_CONTRACT {
                contract_id: 'contract-001',
                energy_amount_kwh: 1000,
                price_per_kwh: 3.8,
                status: 'active'
            }]->(p)
            RETURN u.name as user, p.name as producer
        """)
        record = result.single()
        print(f"   {record['user']} --HAS_CONTRACT--> {record['producer']}")
        
        # 6. Query all nodes
        print("\n6. Node Statistics:")
        result = session.run("MATCH (n) RETURN labels(n)[0] as label, count(*) as count")
        for record in result:
            print(f"   {record['label']}: {record['count']}")
        
        # 7. Query all relationships
        print("\n7. Relationship Statistics:")
        result = session.run("MATCH ()-[r]->() RETURN type(r) as type, count(*) as count")
        for record in result:
            print(f"   {record['type']}: {record['count']}")
        
        # 8. Find recommendations (producers for user)
        print("\n8. Producer Recommendations for Rahul:")
        result = session.run("""
            MATCH (u:User {name: 'Rahul Sharma'})-[r:INTERESTED_IN|HAS_CONTRACT]->(p:Producer)
            RETURN p.name as producer, p.energy_type as type, p.price_per_kwh as price, type(r) as relationship
        """)
        for record in result:
            print(f"   {record['producer']} ({record['type']}) - ₹{record['price']}/kWh - {record['relationship']}")
    
    driver.close()
    print("\n✓ Neo4j test completed successfully!")

if __name__ == "__main__":
    main()
