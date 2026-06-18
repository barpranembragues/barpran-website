import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import Engineering from "@/components/sections/Engineering";
import Motorsport from "@/components/sections/Motorsport";
import Products from "@/components/sections/Products";
import Manufacturing from "@/components/sections/Manufacturing";
import History from "@/components/sections/History";
import Contact from "@/components/sections/Contact";
import ScrollProgress from "@/components/ui/ScrollProgress";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Hero />
      <Manifesto />
      <Engineering />
      <Motorsport />
      <Products />
      <Manufacturing />
      <History />
      <Contact />
    </>
  );
}
