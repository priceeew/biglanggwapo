import { go } from "../router.js";
import { useUser } from "../auth.js";
import LogoutButton from "../LogoutButton.jsx";


export const size = { width: 1440, height: 1311 };

export default function CustomerServices({ title = "SERVICES" }) {
  const user = useUser();
  return (
    <div data-name="Customer — Services" style={{"position":"absolute","left":0,"top":0,"width":1440,"height":1311,"backgroundColor":"#DCE1E4","overflow":"hidden"}}>
      <div data-name="Page" style={{"position":"absolute","left":0,"top":0,"width":1440,"height":1311,"overflow":"hidden"}}>
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
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/services")} style={{"position":"absolute","left":229.67,"top":0,"width":51,"height":62,"borderBottom":"3px solid #F3E300","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":51,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.0,"color":"#F3E300","textAlign":"left","whiteSpace":"pre"}}>{"Services"}</div>
          </div>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/barbers")} style={{"position":"absolute","left":412.33,"top":0,"width":45,"height":62,"borderBottom":"3px solid #1F313E","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":45,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"Barbers"}</div>
          </div>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/appointment-booking")} style={{"position":"absolute","left":589,"top":0,"width":123,"height":62,"borderBottom":"3px solid #1F313E","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":123,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"Appointment Booking"}</div>
          </div>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/my-appointments")} style={{"position":"absolute","left":843.67,"top":0,"width":100,"height":62,"borderBottom":"3px solid #1F313E","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":100,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"My Appointments"}</div>
          </div>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/queue-status")} style={{"position":"absolute","left":1075.33,"top":0,"width":77,"height":62,"borderBottom":"3px solid #1F313E","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":77,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"Queue Status"}</div>
          </div>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/profile-history")} style={{"position":"absolute","left":1284,"top":0,"width":92,"height":62,"borderBottom":"3px solid #1F313E","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":92,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"Profile & History"}</div>
          </div>
        </div>
        <div data-name="Main content" style={{"position":"absolute","left":0,"top":166,"width":1440,"height":978,"overflow":"hidden"}}>
          <div data-name="Page introduction" style={{"position":"absolute","left":64,"top":48,"width":1312,"height":140,"overflow":"hidden"}}>
            <div data-name="Overline" style={{"position":"absolute","left":0,"top":0,"width":151,"height":12,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":10,"lineHeight":1.0,"letterSpacing":1.8,"color":"#2C4C5B","textAlign":"left","whiteSpace":"pre"}}>{"CUSTOMER / SERVICES · DEMO"}</div>
            <div data-name="Title and action" style={{"position":"absolute","left":0,"top":28,"width":1312,"height":74,"overflow":"hidden"}}>
              <div data-name="Title" style={{"position":"absolute","left":0,"top":0,"width":1143,"height":74,"fontFamily":"'Anton', sans-serif","fontWeight":400,"fontSize":64,"lineHeight":1.149999976158142,"color":"#1F313E","textAlign":"left","whiteSpace":"pre-wrap"}}>{"YOUR LOOK. OUR CRAFT."}</div>
              <div data-name="Action" className="nav" role="link" onClick={() => go("/customer/appointment-booking")} style={{"position":"absolute","left":1167,"top":14,"width":145,"height":46,"backgroundColor":"#F3E300","border":"1px solid #F3E300","overflow":"hidden","cursor":"pointer"}}>
                <div data-name="Label" style={{"position":"absolute","left":22,"top":15.5,"width":101,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Find your chair ↗"}</div>
              </div>
            </div>
            <div data-name="Description" style={{"position":"absolute","left":0,"top":118,"width":1312,"height":22,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":14,"lineHeight":1.600000023841858,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"From a quick clean-up to a whole new look. Every service starts with a conversation and ends with the details done right."}</div>
          </div>
          <div data-name="Menu and craft" style={{"position":"absolute","left":64,"top":216,"width":1312,"height":570,"overflow":"hidden"}}>
            <div data-name="Craft introduction" style={{"position":"absolute","left":0,"top":0,"width":410,"height":545,"overflow":"hidden"}}>
              <div data-name="Barber at work" style={{"position":"absolute","left":0,"top":0,"width":410,"height":402,"background":"url(/assets/3e2e4d1474dfeacb515de79b0250f1e37f69f3c0.jpg) center / cover no-repeat"}} />
              <div data-name="Caption" style={{"position":"absolute","left":0,"top":424,"width":140,"height":12,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":10,"lineHeight":1.0,"letterSpacing":1.4,"color":"#2C4C5B","textAlign":"left","whiteSpace":"pre"}}>{"CRAFT OVER HYPE. ALWAYS."}</div>
              <div data-name="Consultation" style={{"position":"absolute","left":0,"top":458,"width":410,"height":52,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":16,"lineHeight":1.649999976158142,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"Tell us what works. Tell us what doesn’t. We listen before we reach for the clippers."}</div>
              <div data-name="Menu notice" style={{"position":"absolute","left":0,"top":532,"width":153,"height":13,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":11,"lineHeight":1.0,"color":"#6C8493","textAlign":"left","whiteSpace":"pre"}}>{"Sample menu · Prices in USD."}</div>
            </div>
            <div data-name="Service menu" style={{"position":"absolute","left":466,"top":0,"width":846,"height":570,"overflow":"hidden"}}>
              <div data-name="Service" style={{"position":"absolute","left":0,"top":0,"width":846,"height":106,"borderTop":"1px solid #B8BFC5","overflow":"hidden"}}>
                <div data-name="Service description" style={{"position":"absolute","left":0,"top":26,"width":591,"height":54,"overflow":"hidden"}}>
                  <div data-name="Name" style={{"position":"absolute","left":0,"top":0,"width":143,"height":27,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":22,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Signature cut"}</div>
                  <div data-name="Description" style={{"position":"absolute","left":0,"top":36,"width":591,"height":18,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.5,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"Consultation, precision cut, hot towel & style."}</div>
                </div>
                <div data-name="Duration" style={{"position":"absolute","left":615,"top":47,"width":56,"height":12,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":10,"lineHeight":1.0,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"45 MIN"}</div>
                <div data-name="Price" style={{"position":"absolute","left":695,"top":29,"width":55,"height":48,"fontFamily":"'Anton', sans-serif","fontWeight":400,"fontSize":32,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre-wrap"}}>{"$40"}</div>
                <div data-name="Action" style={{"position":"absolute","left":774,"top":35,"width":72,"height":36,"backgroundColor":"#F3F5F6","border":"1px solid #B8BFC5","overflow":"hidden"}}>
                  <div data-name="Label" style={{"position":"absolute","left":14,"top":10.5,"width":44,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Book ↗"}</div>
                </div>
              </div>
              <div data-name="Service" style={{"position":"absolute","left":0,"top":106,"width":846,"height":106,"borderTop":"1px solid #B8BFC5","overflow":"hidden"}}>
                <div data-name="Service description" style={{"position":"absolute","left":0,"top":26,"width":591,"height":54,"overflow":"hidden"}}>
                  <div data-name="Name" style={{"position":"absolute","left":0,"top":0,"width":99,"height":27,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":22,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Skin fade"}</div>
                  <div data-name="Description" style={{"position":"absolute","left":0,"top":36,"width":591,"height":18,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.5,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"Seamless blend. Sharp finish. All in the details."}</div>
                </div>
                <div data-name="Duration" style={{"position":"absolute","left":615,"top":47,"width":56,"height":12,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":10,"lineHeight":1.0,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"45 MIN"}</div>
                <div data-name="Price" style={{"position":"absolute","left":695,"top":29,"width":55,"height":48,"fontFamily":"'Anton', sans-serif","fontWeight":400,"fontSize":32,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre-wrap"}}>{"$45"}</div>
                <div data-name="Action" style={{"position":"absolute","left":774,"top":35,"width":72,"height":36,"backgroundColor":"#F3F5F6","border":"1px solid #B8BFC5","overflow":"hidden"}}>
                  <div data-name="Label" style={{"position":"absolute","left":14,"top":10.5,"width":44,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Book ↗"}</div>
                </div>
              </div>
              <div data-name="Service" style={{"position":"absolute","left":0,"top":212,"width":846,"height":106,"borderTop":"1px solid #B8BFC5","overflow":"hidden"}}>
                <div data-name="Service description" style={{"position":"absolute","left":0,"top":26,"width":591,"height":54,"overflow":"hidden"}}>
                  <div data-name="Name" style={{"position":"absolute","left":0,"top":0,"width":134,"height":27,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":22,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Beard sculpt"}</div>
                  <div data-name="Description" style={{"position":"absolute","left":0,"top":36,"width":591,"height":18,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.5,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"Shape, line-up & conditioning for a cleaner profile."}</div>
                </div>
                <div data-name="Duration" style={{"position":"absolute","left":615,"top":47,"width":56,"height":12,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":10,"lineHeight":1.0,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"25 MIN"}</div>
                <div data-name="Price" style={{"position":"absolute","left":695,"top":29,"width":55,"height":48,"fontFamily":"'Anton', sans-serif","fontWeight":400,"fontSize":32,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre-wrap"}}>{"$25"}</div>
                <div data-name="Action" style={{"position":"absolute","left":774,"top":35,"width":72,"height":36,"backgroundColor":"#F3F5F6","border":"1px solid #B8BFC5","overflow":"hidden"}}>
                  <div data-name="Label" style={{"position":"absolute","left":14,"top":10.5,"width":44,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Book ↗"}</div>
                </div>
              </div>
              <div data-name="Service" style={{"position":"absolute","left":0,"top":318,"width":846,"height":106,"borderTop":"1px solid #B8BFC5","overflow":"hidden"}}>
                <div data-name="Service description" style={{"position":"absolute","left":0,"top":26,"width":591,"height":54,"overflow":"hidden"}}>
                  <div data-name="Name" style={{"position":"absolute","left":0,"top":0,"width":126,"height":27,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":22,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Cut + beard"}</div>
                  <div data-name="Description" style={{"position":"absolute","left":0,"top":36,"width":591,"height":18,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.5,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"The full reset. From the first fade to the final line."}</div>
                </div>
                <div data-name="Duration" style={{"position":"absolute","left":615,"top":47,"width":56,"height":12,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":10,"lineHeight":1.0,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"60 MIN"}</div>
                <div data-name="Price" style={{"position":"absolute","left":695,"top":29,"width":55,"height":48,"fontFamily":"'Anton', sans-serif","fontWeight":400,"fontSize":32,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre-wrap"}}>{"$60"}</div>
                <div data-name="Action" style={{"position":"absolute","left":774,"top":35,"width":72,"height":36,"backgroundColor":"#F3F5F6","border":"1px solid #B8BFC5","overflow":"hidden"}}>
                  <div data-name="Label" style={{"position":"absolute","left":14,"top":10.5,"width":44,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Book ↗"}</div>
                </div>
              </div>
              <div data-name="Service" style={{"position":"absolute","left":0,"top":424,"width":846,"height":106,"borderTop":"1px solid #B8BFC5","overflow":"hidden"}}>
                <div data-name="Service description" style={{"position":"absolute","left":0,"top":26,"width":591,"height":54,"overflow":"hidden"}}>
                  <div data-name="Name" style={{"position":"absolute","left":0,"top":0,"width":171,"height":27,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":22,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Hot towel shave"}</div>
                  <div data-name="Description" style={{"position":"absolute","left":0,"top":36,"width":591,"height":18,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.5,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"Traditional straight razor. Modern-day unwind."}</div>
                </div>
                <div data-name="Duration" style={{"position":"absolute","left":615,"top":47,"width":56,"height":12,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":10,"lineHeight":1.0,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"30 MIN"}</div>
                <div data-name="Price" style={{"position":"absolute","left":695,"top":29,"width":55,"height":48,"fontFamily":"'Anton', sans-serif","fontWeight":400,"fontSize":32,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre-wrap"}}>{"$35"}</div>
                <div data-name="Action" style={{"position":"absolute","left":774,"top":35,"width":72,"height":36,"backgroundColor":"#F3F5F6","border":"1px solid #B8BFC5","overflow":"hidden"}}>
                  <div data-name="Label" style={{"position":"absolute","left":14,"top":10.5,"width":44,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Book ↗"}</div>
                </div>
              </div>
              <div data-name="Inclusions" style={{"position":"absolute","left":0,"top":530,"width":846,"height":40,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.7000000476837158,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"All hair types. All styles. Everyone welcome.\nConsultation and finishing included in every service."}</div>
            </div>
          </div>
          <div data-name="Notice" style={{"position":"absolute","left":64,"top":814,"width":1312,"height":81,"backgroundColor":"#DCE1E4","borderLeft":"3px solid #F3E300","overflow":"hidden"}}>
            <div data-name="Notice copy" style={{"position":"absolute","left":20,"top":20,"width":1105,"height":41,"overflow":"hidden"}}>
              <div data-name="Title" style={{"position":"absolute","left":0,"top":0,"width":146,"height":16,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":13,"lineHeight":1.0,"color":"#2C4C5B","textAlign":"left","whiteSpace":"pre"}}>{"Not sure what to book?"}</div>
              <div data-name="Description" style={{"position":"absolute","left":0,"top":22,"width":1105,"height":19,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.600000023841858,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"Choose a signature cut for a fresh shape, a skin fade for a close blend, or cut + beard for the full reset. Your barber will help you find your fit."}</div>
            </div>
            <div data-name="Action" style={{"position":"absolute","left":1149,"top":22.5,"width":143,"height":36,"backgroundColor":"#F3F5F6","border":"1px solid #B8BFC5","overflow":"hidden"}}>
              <div data-name="Label" style={{"position":"absolute","left":14,"top":10.5,"width":115,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.0,"color":"#1F313E","textAlign":"left","whiteSpace":"pre"}}>{"Meet the barbers ↗"}</div>
            </div>
          </div>
          <div data-name="Demo disclaimer" style={{"position":"absolute","left":64,"top":923,"width":1312,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":10,"lineHeight":1.5,"color":"#6C8493","textAlign":"left","whiteSpace":"pre-wrap"}}>{"SAMPLE BUSINESS / All customers, appointments, payments and metrics are illustrative. Prices in USD. Times shown in Chicago time."}</div>
        </div>
        <div data-name="Public footer" style={{"position":"absolute","left":0,"top":1144,"width":1440,"height":167,"backgroundColor":"#1F313E","overflow":"hidden"}}>
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
