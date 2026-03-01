"""
Neo4j Graph Visualization Queries
Run this in Neo4j Aura Console (https://console.neo4j.io)
"""

from neo4j import GraphDatabase

URI = "neo4j+s://00978a83.databases.neo4j.io"
USERNAME = "00978a83"
PASSWORD = "brhOYjozOJOaVBJA0cl8OuwaoKKEvOEvk11toDLxTjY"
DATABASE = "00978a83"


def main():
    driver = GraphDatabase.driver(URI, auth=(USERNAME, PASSWORD))
    
    with driver.session(database=DATABASE) as session:
        print("="*70)
        print("NEO4J GRAPH VISUALIZATION QUERIES")
        print("Copy these queries to Neo4j Aura Console: https://console.neo4j.io")
        print("="*70)
        
        print("\n" + "-"*70)
        print("1. VIEW FULL GRAPH SCHEMA (Run this first!):")
        print("-"*70)
        print("CALL db.schema.visualization()")
        
        print("\n" + "-"*70)
        print("2. VIEW ALL NODES (limited to 500):")
        print("-"*70)
        print("MATCH (n) RETURN n LIMIT 500")
        
        print("\n" + "-"*70)
        print("3. VIEW ALL RELATIONSHIPS:")
        print("-"*70)
        print("MATCH p=()-[r]->() RETURN p LIMIT 200")
        
        print("\n" + "-"*70)
        print("4. VIEW USER-PRODUCER NETWORK:")
        print("-"*70)
        print("""MATCH (u:User)-[r]->(p:Producer)
RETURN u, r, p LIMIT 100""")
        
        print("\n" + "-"*70)
        print("5. VIEW ENERGY FLOW (Users -> Contracts -> Producers):")
        print("-"*70)
        print("""MATCH path = (u:User)-[:HAS_CONTRACT]->(p:Producer)-[:OFFERS]->(l:EnergyListing)
RETURN path LIMIT 50""")
        
        print("\n" + "-"*70)
        print("6. VIEW TRANSACTION NETWORK:")
        print("-"*70)
        print("""MATCH path = (u:User)-[:MADE_TRANSACTION]->(t:Transaction)-[:FOR_CONTRACT]->(c:Contract)
RETURN path LIMIT 50""")
        
        print("\n" + "-"*70)
        print("7. VIEW CERTIFICATE FLOW:")
        print("-"*70)
        print("""MATCH path = (u:User)-[:OWNS_CERTIFICATE]->(cert:Certificate)<-[:ISSUED]-(p:Producer)
RETURN path LIMIT 50""")
        
        print("\n" + "-"*70)
        print("8. VIEW SIMILAR USERS NETWORK (Collaborative Filtering):")
        print("-"*70)
        print("""MATCH path = (u1:User)-[:SIMILAR_TO]-(u2:User)
RETURN path LIMIT 100""")
        
        print("\n" + "-"*70)
        print("9. VIEW COMPETING PRODUCERS:")
        print("-"*70)
        print("""MATCH path = (p1:Producer)-[:COMPETES_WITH]-(p2:Producer)
RETURN path LIMIT 50""")
        
        print("\n" + "-"*70)
        print("10. FULL ECOSYSTEM VIEW (Sample):")
        print("-"*70)
        print("""MATCH (u:User)-[r1:HAS_CONTRACT]->(p:Producer)
MATCH (u)-[r2:OWNS_CERTIFICATE]->(c:Certificate)
MATCH (p)-[r3:OFFERS]->(l:EnergyListing)
RETURN u, r1, p, r2, c, r3, l
LIMIT 30""")
        
        print("\n" + "="*70)
        print("EXECUTING SAMPLE QUERIES...")
        print("="*70)
        
        # Sample: Show a small portion of the graph
        print("\nSample: 5 Users with their Producers and Certificates")
        print("-"*70)
        result = session.run("""
            MATCH (u:User)-[:HAS_CONTRACT]->(p:Producer)
            OPTIONAL MATCH (u)-[:OWNS_CERTIFICATE]->(c:Certificate)
            RETURN u.name as user, p.name as producer, 
                   p.energy_type as energy, c.type as certificate
            LIMIT 10
        """)
        for record in result:
            cert = record["certificate"] or "None"
            print(f"  {record['user']:25} -> {record['producer']:30} ({record['energy']}) [Cert: {cert}]")
        
        # Show graph statistics
        print("\n" + "="*70)
        print("CURRENT GRAPH STATISTICS")
        print("="*70)
        
        result = session.run("MATCH (n) RETURN labels(n)[0] as label, count(*) as count ORDER BY count DESC")
        print("\nNodes:")
        for record in result:
            print(f"  {record['label']:20}: {record['count']:,}")
        
        result = session.run("MATCH ()-[r]->() RETURN type(r) as type, count(*) as count ORDER BY count DESC")
        print("\nRelationships:")
        for record in result:
            print(f"  {record['type']:20}: {record['count']:,}")
    
    driver.close()
    print("\n" + "="*70)
    print("Copy the queries above to Neo4j Aura Console to visualize!")
    print("URL: https://console.neo4j.io")
    print("="*70)


if __name__ == "__main__":
    main()
