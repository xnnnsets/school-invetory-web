import { motion } from "framer-motion";

export const Page = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.18, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export const ModalPanel = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98, y: 8 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.98, y: 8 }}
    transition={{ duration: 0.16, ease: "easeOut" }}
    className="w-full"
  >
    {children}
  </motion.div>
);

