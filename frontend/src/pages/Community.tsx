import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Search, MessageSquare, Heart, Share2, Trophy, Star, Zap, 
  Leaf, Sun, Wind, TrendingUp, MapPin, Calendar, ThumbsUp, 
  MessageCircle, Award, Target, Crown, Medal, ExternalLink
} from "lucide-react";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { PageTransition } from "@/components/ui/PageTransition";

interface CommunityMember {
  id: string;
  name: string;
  avatar: string;
  location: string;
  role: "producer" | "consumer" | "prosumer";
  energyType: "solar" | "wind" | "hydro" | "biogas" | "mixed";
  carbonOffset: string;
  tradingVolume: string;
  joinedDate: string;
  rank: number;
  badges: string[];
}

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  tags: string[];
  image?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: string;
  participants: number;
  deadline: string;
  progress: number;
  status: "active" | "completed" | "upcoming";
}

const mockMembers: CommunityMember[] = [
  {
    id: "1",
    name: "Priya Sharma",
    avatar: "",
    location: "Mumbai, MH",
    role: "producer",
    energyType: "solar",
    carbonOffset: "12.5 tons",
    tradingVolume: "45,000 kWh",
    joinedDate: "Jan 2023",
    rank: 1,
    badges: ["Top Producer", "Green Champion", "Early Adopter"],
  },
  {
    id: "2",
    name: "Amit Patel",
    avatar: "",
    location: "Ahmedabad, GJ",
    role: "prosumer",
    energyType: "wind",
    carbonOffset: "9.8 tons",
    tradingVolume: "32,000 kWh",
    joinedDate: "Mar 2023",
    rank: 2,
    badges: ["Wind Pioneer", "Community Leader"],
  },
  {
    id: "3",
    name: "Sunita Reddy",
    avatar: "",
    location: "Hyderabad, TS",
    role: "consumer",
    energyType: "mixed",
    carbonOffset: "6.2 tons",
    tradingVolume: "18,000 kWh",
    joinedDate: "Jun 2023",
    rank: 3,
    badges: ["Eco Warrior", "100% Green"],
  },
];

const mockPosts: Post[] = [
  {
    id: "1",
    author: "Priya Sharma",
    avatar: "",
    content: "Just reached 10 tons of carbon offset! 🌱 Thanks to everyone in the community who made this possible. Together, we're making a real difference for our planet. #GreenEnergy #Sustainability",
    timestamp: "2 hours ago",
    likes: 45,
    comments: 12,
    shares: 8,
    tags: ["GreenEnergy", "Sustainability", "Milestone"],
  },
  {
    id: "2",
    author: "GreenGrid Team",
    avatar: "",
    content: "📢 Exciting news! Our community has collectively offset 1,000 tons of CO2 this month! That's equivalent to planting 45,000 trees. Thank you all for being part of this journey. 🌳",
    timestamp: "5 hours ago",
    likes: 128,
    comments: 34,
    shares: 56,
    tags: ["CommunityMilestone", "CarbonOffset"],
  },
  {
    id: "3",
    author: "Amit Patel",
    avatar: "",
    content: "Tips for maximizing your solar panel efficiency during monsoon season: 1) Regular cleaning 2) Check for shade from growing trees 3) Monitor inverter performance. Happy to help if anyone has questions!",
    timestamp: "1 day ago",
    likes: 67,
    comments: 23,
    shares: 15,
    tags: ["SolarTips", "Monsoon", "Efficiency"],
  },
];

const mockChallenges: Challenge[] = [
  {
    id: "1",
    title: "Green Week Challenge",
    description: "Trade 100% renewable energy for one week",
    reward: "500 Green Points + Badge",
    participants: 234,
    deadline: "3 days left",
    progress: 72,
    status: "active",
  },
  {
    id: "2",
    title: "Solar Champions",
    description: "Top 10 solar producers this month",
    reward: "₹5,000 bonus",
    participants: 89,
    deadline: "2 weeks left",
    progress: 45,
    status: "active",
  },
  {
    id: "3",
    title: "Carbon Crusher",
    description: "Offset 1 ton of CO2",
    reward: "Exclusive Badge",
    participants: 567,
    deadline: "Completed",
    progress: 100,
    status: "completed",
  },
];

const Community = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const getRoleColor = (role: CommunityMember["role"]) => {
    switch (role) {
      case "producer":
        return "bg-primary/10 text-primary border-primary/20";
      case "consumer":
        return "bg-accent/10 text-accent border-accent/20";
      case "prosumer":
        return "bg-saffron/10 text-saffron border-saffron/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getEnergyIcon = (type: CommunityMember["energyType"]) => {
    switch (type) {
      case "solar":
        return <Sun className="w-4 h-4 text-saffron" />;
      case "wind":
        return <Wind className="w-4 h-4 text-accent" />;
      case "hydro":
        return <Zap className="w-4 h-4 text-blue-400" />;
      case "biogas":
        return <Leaf className="w-4 h-4 text-primary" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold">#{rank}</span>;
    }
  };

  return (
    <AppLayout>
      <PageTransition>
        <div className="relative min-h-screen">
          <FloatingOrbs />
          
          <div className="relative z-10 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">Community</h1>
                <p className="text-sm text-muted-foreground mt-1">Connect with fellow sustainability champions</p>
              </div>
              <Button>
                <MessageSquare className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </div>

            {/* Community Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Active Members", value: "12,450", icon: Users, color: "text-primary" },
                { label: "Total CO₂ Offset", value: "1,250 tons", icon: Leaf, color: "text-primary" },
                { label: "Energy Traded", value: "2.5 GWh", icon: Zap, color: "text-saffron" },
                { label: "Active Challenges", value: "5", icon: Trophy, color: "text-accent" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className={`text-2xl font-bold font-heading ${stat.color}`}>{stat.value}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Tabs defaultValue="feed">
                  <TabsList className="bg-card/80 border border-border">
                    <TabsTrigger value="feed">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Feed
                    </TabsTrigger>
                    <TabsTrigger value="challenges">
                      <Trophy className="w-4 h-4 mr-2" />
                      Challenges
                    </TabsTrigger>
                    <TabsTrigger value="leaderboard">
                      <Award className="w-4 h-4 mr-2" />
                      Leaderboard
                    </TabsTrigger>
                  </TabsList>

                  {/* Feed Tab */}
                  <TabsContent value="feed" className="space-y-4 mt-4">
                    {/* Search */}
                    <Card className="bg-card/80 backdrop-blur-sm border-border">
                      <CardContent className="p-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search posts, tags, or members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-background/50"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Posts */}
                    {mockPosts.map((post, i) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card className="bg-card/80 backdrop-blur-sm border-border">
                          <CardContent className="p-5">
                            <div className="flex gap-3 mb-4">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={post.avatar} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {post.author.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground">{post.author}</p>
                                <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                              </div>
                            </div>

                            <p className="text-sm text-foreground leading-relaxed mb-4">{post.content}</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                              {post.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex items-center gap-4 pt-3 border-t border-border">
                              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                                <Heart className="w-4 h-4" />
                                {post.likes}
                              </button>
                              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                                <MessageSquare className="w-4 h-4" />
                                {post.comments}
                              </button>
                              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                                <Share2 className="w-4 h-4" />
                                {post.shares}
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </TabsContent>

                  {/* Challenges Tab */}
                  <TabsContent value="challenges" className="space-y-4 mt-4">
                    {mockChallenges.map((challenge, i) => (
                      <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card className="bg-card/80 backdrop-blur-sm border-border">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                  challenge.status === "active" 
                                    ? "bg-primary/10" 
                                    : challenge.status === "completed"
                                    ? "bg-accent/10"
                                    : "bg-muted/50"
                                }`}>
                                  <Trophy className={`w-6 h-6 ${
                                    challenge.status === "active" 
                                      ? "text-primary" 
                                      : challenge.status === "completed"
                                      ? "text-accent"
                                      : "text-muted-foreground"
                                  }`} />
                                </div>
                                <div>
                                  <h3 className="font-medium text-foreground">{challenge.title}</h3>
                                  <p className="text-sm text-muted-foreground">{challenge.description}</p>
                                </div>
                              </div>
                              <Badge className={
                                challenge.status === "active"
                                  ? "bg-primary/10 text-primary border-primary/20"
                                  : challenge.status === "completed"
                                  ? "bg-accent/10 text-accent border-accent/20"
                                  : "bg-muted text-muted-foreground"
                              }>
                                {challenge.status}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">Reward</p>
                                <p className="font-medium text-primary">{challenge.reward}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Participants</p>
                                <p className="font-medium">{challenge.participants}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Deadline</p>
                                <p className="font-medium">{challenge.deadline}</p>
                              </div>
                            </div>

                            {challenge.status === "active" && (
                              <>
                                <div className="space-y-1 mb-4">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Your Progress</span>
                                    <span className="text-foreground">{challenge.progress}%</span>
                                  </div>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                                      style={{ width: `${challenge.progress}%` }}
                                    />
                                  </div>
                                </div>
                                <Button size="sm" className="w-full">
                                  <Target className="w-4 h-4 mr-2" />
                                  Continue Challenge
                                </Button>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </TabsContent>

                  {/* Leaderboard Tab */}
                  <TabsContent value="leaderboard" className="mt-4">
                    <Card className="bg-card/80 backdrop-blur-sm border-border">
                      <CardHeader>
                        <CardTitle className="text-lg">Top Sustainability Champions</CardTitle>
                        <CardDescription>This month's leaders in clean energy trading</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {mockMembers.map((member, i) => (
                          <motion.div
                            key={member.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`flex items-center gap-4 p-4 rounded-lg ${
                              i === 0 ? "bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20" : "bg-muted/30"
                            }`}
                          >
                            <div className="w-8 flex items-center justify-center">
                              {getRankIcon(member.rank)}
                            </div>
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {member.name.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{member.name}</p>
                                {getEnergyIcon(member.energyType)}
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {member.location}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">{member.carbonOffset}</p>
                              <p className="text-xs text-muted-foreground">CO₂ offset</p>
                            </div>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Top Members */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="w-5 h-5 text-saffron" />
                        Featured Members
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {mockMembers.slice(0, 3).map((member) => (
                        <div key={member.id} className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {member.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{member.name}</p>
                            <div className="flex items-center gap-1">
                              <Badge className={`${getRoleColor(member.role)} text-xs`}>
                                {member.role}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            Follow
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        View All Members
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Trending Tags */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Trending Topics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {["#SolarPower", "#GreenEnergy", "#CarbonNeutral", "#Sustainability", "#CleanTech", "#RenewableEnergy", "#NetZero", "#EcoFriendly"].map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Upcoming Events */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="bg-card/80 backdrop-blur-sm border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-accent" />
                        Upcoming Events
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="font-medium text-sm">Green Energy Summit</p>
                        <p className="text-xs text-muted-foreground mt-1">March 15, 2024 • Virtual</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="font-medium text-sm">Solar Workshop</p>
                        <p className="text-xs text-muted-foreground mt-1">March 22, 2024 • Mumbai</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="font-medium text-sm">Community Meetup</p>
                        <p className="text-xs text-muted-foreground mt-1">April 1, 2024 • Delhi</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default Community;
