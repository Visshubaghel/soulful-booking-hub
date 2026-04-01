import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar } from "lucide-react";

const posts = [
  {
    title: "Perfect Summer Body: Tips from Our Experts",
    excerpt: "Most people get happy when the days get longer and the weather gets nicer. Here's how to prepare your skin for summer...",
    date: "March 2, 2024",
    category: "Body Care",
  },
  {
    title: "Your Secret Weapon for Flawless Skin",
    excerpt: "As the sun shines brighter and summer festivities begin, many of us look forward to having radiant, youthful skin...",
    date: "March 2, 2024",
    category: "Skin Care",
  },
  {
    title: "Hair Transplant Consultation Guide",
    excerpt: "Hair loss can be a significant concern. Hair transplants offer a permanent solution. Here's what to ask your doctor...",
    date: "May 13, 2024",
    category: "Hair Care",
  },
];

const BlogPreviewSection = () => {
  return (
    <section className="section-padding bg-secondary">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-14 gap-4">
          <div>
            <span className="section-label">Blog</span>
            <h2 className="section-heading mt-3">Recent Posts</h2>
          </div>
          <Link to="/blog" className="flex items-center gap-2 text-primary font-body font-semibold hover:gap-3 transition-all">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <motion.article
              key={post.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow group"
            >
              <div className="h-48 gradient-rose-subtle flex items-center justify-center">
                <span className="text-sm font-body font-semibold text-primary px-4 py-1 bg-card/80 rounded-full">
                  {post.category}
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs font-body text-muted-foreground mb-3">
                  <Calendar className="w-3 h-3" />
                  {post.date}
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm font-body text-muted-foreground line-clamp-2">{post.excerpt}</p>
                <Link to="/blog" className="inline-flex items-center gap-1 mt-4 text-sm font-body font-semibold text-primary hover:gap-2 transition-all">
                  Read More <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogPreviewSection;
