import { motion } from "framer-motion";

export function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full opacity-[0.04] blur-[100px]"
        style={{ background: "hsl(142 72% 40%)" }}
      />
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[15%] right-[10%] w-[350px] h-[350px] rounded-full opacity-[0.03] blur-[100px]"
        style={{ background: "hsl(217 91% 60%)" }}
      />
      <motion.div
        animate={{ x: [0, 15, 0], y: [0, -15, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[50%] right-[30%] w-[250px] h-[250px] rounded-full opacity-[0.025] blur-[100px]"
        style={{ background: "hsl(30 100% 60%)" }}
      />
    </div>
  );
}
