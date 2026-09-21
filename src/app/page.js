import Barbers from "@/components/barbers/Barbers";
import Booking from "@/components/booking/Booking";
import Hero from "@/components/hero/Hero";
import Services from "@/components/services/Services";
import Testimonial from "@/components/testimonials/Testimonials";


export default function Home() {
  return (
    <div>
    <Hero/>
    <Services/>
    <Barbers/>
    <Testimonial/>
    <Booking/>
    </div>
  );
}
