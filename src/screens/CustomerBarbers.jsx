import { go } from "../router.js";
import { useUser } from "../auth.js";
import LogoutButton from "../LogoutButton.jsx";


export const size = { width: 1440, height: 1446 };

export default function CustomerBarbers({ title = "BARBERS" }) {
  const user = useUser();
  return (
    <div data-name="Customer — Barbers" style={{"position":"absolute","left":0,"top":0,"width":1440,"height":1446,"backgroundColor":"#DCE1E4","overflow":"hidden"}}>
      <div data-name="Page" style={{"position":"absolute","left":0,"top":0,"width":1440,"height":1446,"overflow":"hidden"}}>
        <div data-name="Public masthead" style={{"position":"absolute","left":0,"top":0,"width":1440,"height":104,"backgroundColor":"#1F313E","overflow":"hidden"}}>
          <div data-name="Brand" style={{"position":"absolute","left":64,"top":29,"width":203,"height":46}}>
            <img data-name="Brand logo" alt="Biglang Guapo" src="/logo.png" style={{"position":"absolute","left":0,"top":-12,"width":56,"height":62,"objectFit":"contain"}} />
            <div data-name="Wordmark" style={{"position":"absolute","left":64,"top":0,"width":159,"height":46}}>
              <div data-name="Name" style={{"position":"absolute","left":0,"top":0,"width":159,"height":33,"fontFamily":"'Anton', sans-serif","fontWeight":400,"fontSize":22,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"BIGLANG GUAPO"}</div>
              <div data-name="Descriptor" style={{"position":"absolute","left":0,"top":36,"width":104,"height":10,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":8,"lineHeight":1.0,"letterSpacing":2,"color":"#B8BFC5","textAlign":"left","whiteSpace":"pre"}}>{"BARBERSHOP · EST. 2024"}</div>
            </div>
          </div>
          <div data-name="Philosophy" style={{"position":"absolute","left":584,"top":45.5,"width":175,"height":13,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":11,"lineHeight":1.0,"letterSpacing":1.4,"color":"#B8BFC5","textAlign":"left","whiteSpace":"pre"}}>{"GOOD CUTS. BETTER COMPANY."}</div>
          <LogoutButton variant="light" style={{ left: 930, top: 29, width: 110, height: 46 }} />
          <div data-name="Account" className="nav" role="link" onClick={() => go("/customer/profile-history")} style={{"position":"absolute","left":1076,"top":29,"width":300,"height":46,"overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Identity" style={{"position":"absolute","left":0,"top":15.5,"width":146,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{user.name}</div>
            <div data-name="Action" className="nav" role="link" onClick={(e) => { e.stopPropagation(); go("/customer/appointment-booking"); }} style={{"position":"absolute","left":170,"top":0,"width":130,"height":46,"backgroundColor":"#F3E300","border":"1px solid #F3E300","overflow":"hidden","cursor":"pointer"}}>
              <div data-name="Label" style={{"position":"absolute","left":22,"top":15.5,"width":86,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Book a chair ↗"}</div>
            </div>
          </div>
        </div>
        <div data-name="Customer navigation" style={{"position":"absolute","left":0,"top":104,"width":1440,"height":62,"backgroundColor":"#1F313E","overflow":"hidden"}}>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/")} style={{"position":"absolute","left":64,"top":0,"width":34,"height":62,"borderBottom":"3px solid #1F313E","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":34,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"Home"}</div>
          </div>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/services")} style={{"position":"absolute","left":229.83,"top":0,"width":49,"height":62,"borderBottom":"3px solid #1F313E","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":49,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"Services"}</div>
          </div>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/barbers")} style={{"position":"absolute","left":410.67,"top":0,"width":46,"height":62,"borderBottom":"3px solid #F3E300","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":46,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.0,"color":"#F3E300","textAlign":"left","whiteSpace":"pre"}}>{"Barbers"}</div>
          </div>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/appointment-booking")} style={{"position":"absolute","left":588.5,"top":0,"width":123,"height":62,"borderBottom":"3px solid #1F313E","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":123,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"Appointment Booking"}</div>
          </div>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/my-appointments")} style={{"position":"absolute","left":843.33,"top":0,"width":100,"height":62,"borderBottom":"3px solid #1F313E","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":100,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"My Appointments"}</div>
          </div>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/queue-status")} style={{"position":"absolute","left":1075.17,"top":0,"width":77,"height":62,"borderBottom":"3px solid #1F313E","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":77,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"Queue Status"}</div>
          </div>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/profile-history")} style={{"position":"absolute","left":1284,"top":0,"width":92,"height":62,"borderBottom":"3px solid #1F313E","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":92,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"Profile & History"}</div>
          </div>
        </div>
        <div data-name="Main content" style={{"position":"absolute","left":0,"top":166,"width":1440,"height":1113,"overflow":"hidden"}}>
          <div data-name="Page introduction" style={{"position":"absolute","left":64,"top":48,"width":1312,"height":140,"overflow":"hidden"}}>
            <div data-name="Overline" style={{"position":"absolute","left":0,"top":0,"width":149,"height":12,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":10,"lineHeight":1.0,"letterSpacing":1.8,"color":"#2C4C5B","textAlign":"left","whiteSpace":"pre"}}>{"CUSTOMER / BARBERS · DEMO"}</div>
            <div data-name="Title and action" style={{"position":"absolute","left":0,"top":28,"width":1312,"height":74,"overflow":"hidden"}}>
              <div data-name="Title" style={{"position":"absolute","left":0,"top":0,"width":1312,"height":74,"fontFamily":"'Anton', sans-serif","fontWeight":400,"fontSize":64,"lineHeight":1.149999976158142,"color":"#1F313E","textAlign":"left","whiteSpace":"pre-wrap"}}>{"MEET YOUR PEOPLE."}</div>
            </div>
            <div data-name="Description" style={{"position":"absolute","left":0,"top":118,"width":1312,"height":22,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":14,"lineHeight":1.600000023841858,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"Different styles. Same attention to detail. Pick your barber or let us introduce you."}</div>
          </div>
          <div data-name="Barber profiles" style={{"position":"absolute","left":64,"top":216,"width":1312,"height":705,"overflow":"hidden"}}>
            <div data-name="Barber profile" style={{"position":"absolute","left":0,"top":0,"width":421.33,"height":705,"overflow":"hidden"}}>
              <div data-name="Portrait" style={{"position":"absolute","left":0,"top":0,"width":421.33,"height":390,"background":"url(/assets/805004c93815d3419df849e1872b540abd8bb2bd.jpg) center / cover no-repeat"}} />
              <div data-name="Name" style={{"position":"absolute","left":0,"top":408,"width":165,"height":48,"fontFamily":"'Anton', sans-serif","fontWeight":400,"fontSize":32,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"MARCUS REED"}</div>
              <div data-name="Role" style={{"position":"absolute","left":0,"top":474,"width":96,"height":12,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":10,"lineHeight":1.0,"letterSpacing":1.3,"color":"#2C4C5B","textAlign":"left","whiteSpace":"pre"}}>{"FOUNDER / BARBER"}</div>
              <div data-name="Specialties" style={{"position":"absolute","left":0,"top":504,"width":179,"height":16,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":13,"lineHeight":1.0,"color":"#6C8493","textAlign":"left","whiteSpace":"pre"}}>{"Classic cuts · Precision fades"}</div>
              <div data-name="Approach" style={{"position":"absolute","left":0,"top":538,"width":421.33,"height":44,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":13,"lineHeight":1.7000000476837158,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"Considered classics, clean blends and a consultation that starts with you."}</div>
              <div data-name="Availability" style={{"position":"absolute","left":0,"top":600,"width":421.33,"height":41,"borderTop":"1px solid #B8BFC5","overflow":"hidden"}}>
                <div data-name="Next opening" style={{"position":"absolute","left":0,"top":14,"width":102,"height":13,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":11,"lineHeight":1.0,"color":"#6C8493","textAlign":"left","whiteSpace":"pre"}}>{"Demo next opening"}</div>
                <div data-name="Time" style={{"position":"absolute","left":346.33,"top":14,"width":75,"height":13,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":11,"lineHeight":1.0,"color":"#2C4C5B","textAlign":"left","whiteSpace":"pre"}}>{"Thu 08 · 10:00"}</div>
              </div>
              <div data-name="Action" style={{"position":"absolute","left":0,"top":659,"width":162,"height":46,"backgroundColor":"#F3E300","border":"1px solid #F3E300","overflow":"hidden"}}>
                <div data-name="Label" style={{"position":"absolute","left":22,"top":15.5,"width":118,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Book with Marcus ↗"}</div>
              </div>
            </div>
            <div data-name="Barber profile" style={{"position":"absolute","left":445.33,"top":0,"width":421.33,"height":705,"overflow":"hidden"}}>
              <div data-name="Portrait" style={{"position":"absolute","left":0,"top":0,"width":421.33,"height":390,"background":"url(/assets/e43d970a54522075012642b09ba193bddf12f8e8.jpg) center / cover no-repeat"}} />
              <div data-name="Name" style={{"position":"absolute","left":0,"top":408,"width":146,"height":48,"fontFamily":"'Anton', sans-serif","fontWeight":400,"fontSize":32,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"ALEX RIVERA"}</div>
              <div data-name="Role" style={{"position":"absolute","left":0,"top":474,"width":78,"height":12,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":10,"lineHeight":1.0,"letterSpacing":1.3,"color":"#2C4C5B","textAlign":"left","whiteSpace":"pre"}}>{"SENIOR BARBER"}</div>
              <div data-name="Specialties" style={{"position":"absolute","left":0,"top":504,"width":192,"height":16,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":13,"lineHeight":1.0,"color":"#6C8493","textAlign":"left","whiteSpace":"pre"}}>{"Textured crops · Beard shaping"}</div>
              <div data-name="Approach" style={{"position":"absolute","left":0,"top":538,"width":421.33,"height":44,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":13,"lineHeight":1.7000000476837158,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"Natural texture, thoughtful shaping and beard details that finish the look."}</div>
              <div data-name="Availability" style={{"position":"absolute","left":0,"top":600,"width":421.33,"height":41,"borderTop":"1px solid #B8BFC5","overflow":"hidden"}}>
                <div data-name="Next opening" style={{"position":"absolute","left":0,"top":14,"width":102,"height":13,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":11,"lineHeight":1.0,"color":"#6C8493","textAlign":"left","whiteSpace":"pre"}}>{"Demo next opening"}</div>
                <div data-name="Time" style={{"position":"absolute","left":347.33,"top":14,"width":74,"height":13,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":11,"lineHeight":1.0,"color":"#2C4C5B","textAlign":"left","whiteSpace":"pre"}}>{"Thu 08 · 11:30"}</div>
              </div>
              <div data-name="Action" style={{"position":"absolute","left":0,"top":659,"width":145,"height":46,"backgroundColor":"#F3E300","border":"1px solid #F3E300","overflow":"hidden"}}>
                <div data-name="Label" style={{"position":"absolute","left":22,"top":15.5,"width":101,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Book with Alex ↗"}</div>
              </div>
            </div>
            <div data-name="Barber profile" style={{"position":"absolute","left":890.67,"top":0,"width":421.33,"height":705,"overflow":"hidden"}}>
              <div data-name="Portrait" style={{"position":"absolute","left":0,"top":0,"width":421.33,"height":390,"background":"url(/assets/eaa0933b53a2de8c7ff23a9601f8eea9b0000cd1.jpg) center / cover no-repeat"}} />
              <div data-name="Name" style={{"position":"absolute","left":0,"top":408,"width":143,"height":48,"fontFamily":"'Anton', sans-serif","fontWeight":400,"fontSize":32,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"JAMIE PARK"}</div>
              <div data-name="Role" style={{"position":"absolute","left":0,"top":474,"width":89,"height":12,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":10,"lineHeight":1.0,"letterSpacing":1.3,"color":"#2C4C5B","textAlign":"left","whiteSpace":"pre"}}>{"BARBER / STYLIST"}</div>
              <div data-name="Specialties" style={{"position":"absolute","left":0,"top":504,"width":185,"height":16,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":13,"lineHeight":1.0,"color":"#6C8493","textAlign":"left","whiteSpace":"pre"}}>{"Scissor work · Modern mullets"}</div>
              <div data-name="Approach" style={{"position":"absolute","left":0,"top":538,"width":421.33,"height":44,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":13,"lineHeight":1.7000000476837158,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"Scissor-led cuts, movement and a modern shape that works with your hair."}</div>
              <div data-name="Availability" style={{"position":"absolute","left":0,"top":600,"width":421.33,"height":41,"borderTop":"1px solid #B8BFC5","overflow":"hidden"}}>
                <div data-name="Next opening" style={{"position":"absolute","left":0,"top":14,"width":102,"height":13,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":11,"lineHeight":1.0,"color":"#6C8493","textAlign":"left","whiteSpace":"pre"}}>{"Demo next opening"}</div>
                <div data-name="Time" style={{"position":"absolute","left":346.33,"top":14,"width":75,"height":13,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":11,"lineHeight":1.0,"color":"#2C4C5B","textAlign":"left","whiteSpace":"pre"}}>{"Thu 08 · 14:00"}</div>
              </div>
              <div data-name="Action" style={{"position":"absolute","left":0,"top":659,"width":154,"height":46,"backgroundColor":"#F3E300","border":"1px solid #F3E300","overflow":"hidden"}}>
                <div data-name="Label" style={{"position":"absolute","left":22,"top":15.5,"width":110,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Book with Jamie ↗"}</div>
              </div>
            </div>
          </div>
          <div data-name="Notice" style={{"position":"absolute","left":64,"top":949,"width":1312,"height":81,"backgroundColor":"#DCE1E4","borderLeft":"3px solid #F3E300","overflow":"hidden"}}>
            <div data-name="Notice copy" style={{"position":"absolute","left":20,"top":20,"width":1138,"height":41,"overflow":"hidden"}}>
              <div data-name="Title" style={{"position":"absolute","left":0,"top":0,"width":179,"height":16,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":13,"lineHeight":1.0,"color":"#2C4C5B","textAlign":"left","whiteSpace":"pre"}}>{"No favorite yet? No problem."}</div>
              <div data-name="Description" style={{"position":"absolute","left":0,"top":22,"width":1138,"height":19,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.600000023841858,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"Select “Any available barber” at booking and we’ll match your service to an open chair. All availability shown here is illustrative."}</div>
            </div>
            <div data-name="Action" style={{"position":"absolute","left":1182,"top":22.5,"width":110,"height":36,"backgroundColor":"#F3F5F6","border":"1px solid #B8BFC5","overflow":"hidden"}}>
              <div data-name="Label" style={{"position":"absolute","left":14,"top":10.5,"width":82,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Find a chair ↗"}</div>
            </div>
          </div>
          <div data-name="Demo disclaimer" style={{"position":"absolute","left":64,"top":1058,"width":1312,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":10,"lineHeight":1.5,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"GUAPO BUSINESS / All customers, appointments, payments and metrics are illustrative. Prices in USD pero nasa Pinas. Times shown in are Pinoy Time."}</div>
        </div>
        <div data-name="Public footer" style={{"position":"absolute","left":0,"top":1279,"width":1440,"height":167,"backgroundColor":"#1F313E","overflow":"hidden"}}>
          <div data-name="Footer heading" style={{"position":"absolute","left":64,"top":32,"width":1312,"height":54,"overflow":"hidden"}}>
            <div data-name="Wordmark" style={{"position":"absolute","left":0,"top":0,"width":261,"height":54,"fontFamily":"'Anton', sans-serif","fontWeight":400,"fontSize":36,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"BIGLANG GUAPO"}</div>
            <div data-name="Hours" style={{"position":"absolute","left":1115,"top":0,"width":197,"height":13,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":11,"lineHeight":1.0,"color":"#B8BFC5","textAlign":"left","whiteSpace":"pre"}}>{"TUE–FRI 10–7  /  SAT 9–5  /  SUN 10–3"}</div>
          </div>
          <div data-name="Rule" style={{"position":"absolute","left":64,"top":104,"width":1312,"height":1,"backgroundColor":"#2C4C5B"}} />
          <div data-name="Footer details" style={{"position":"absolute","left":64,"top":123,"width":1312,"height":12,"overflow":"hidden"}}>
            <div data-name="Copyright" style={{"position":"absolute","left":0,"top":0,"width":305,"height":12,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":10,"lineHeight":1.0,"color":"#B8BFC5","textAlign":"left","whiteSpace":"pre"}}>{"© 2026 Biglang Guapo. Sample barbershop website template."}</div>
            <div data-name="Policies" style={{"position":"absolute","left":1121,"top":0,"width":191,"height":12,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":10,"lineHeight":1.0,"color":"#B8BFC5","textAlign":"left","whiteSpace":"pre"}}>{"Privacy policy / Booking policy / Contact"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
