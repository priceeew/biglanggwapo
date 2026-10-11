import { go } from "../router.js";
import { useUser } from "../auth.js";
import LogoutButton from "../LogoutButton.jsx";


export const size = { width: 1440, height: 1381 };

export default function CustomerQueueStatus({ title = "QUEUE STATUS" }) {
  const user = useUser();
  return (
    <div data-name="Customer — Queue Status" style={{"position":"absolute","left":0,"top":0,"width":1440,"height":1381,"backgroundColor":"#DCE1E4","overflow":"hidden"}}>
      <div data-name="Page" style={{"position":"absolute","left":0,"top":0,"width":1440,"height":1381,"overflow":"hidden"}}>
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
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/services")} style={{"position":"absolute","left":229.67,"top":0,"width":49,"height":62,"borderBottom":"3px solid #1F313E","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":49,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"Services"}</div>
          </div>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/barbers")} style={{"position":"absolute","left":410.33,"top":0,"width":45,"height":62,"borderBottom":"3px solid #1F313E","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":45,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"Barbers"}</div>
          </div>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/appointment-booking")} style={{"position":"absolute","left":587,"top":0,"width":123,"height":62,"borderBottom":"3px solid #1F313E","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":123,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"Appointment Booking"}</div>
          </div>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/my-appointments")} style={{"position":"absolute","left":841.67,"top":0,"width":100,"height":62,"borderBottom":"3px solid #1F313E","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":100,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"My Appointments"}</div>
          </div>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/queue-status")} style={{"position":"absolute","left":1073.33,"top":0,"width":79,"height":62,"borderBottom":"3px solid #F3E300","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":79,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":600,"fontSize":12,"lineHeight":1.0,"color":"#F3E300","textAlign":"left","whiteSpace":"pre"}}>{"Queue Status"}</div>
          </div>
          <div data-name="Navigation link" className="nav" role="link" onClick={() => go("/customer/profile-history")} style={{"position":"absolute","left":1284,"top":0,"width":92,"height":62,"borderBottom":"3px solid #1F313E","overflow":"hidden","cursor":"pointer"}}>
            <div data-name="Module" style={{"position":"absolute","left":0,"top":23.5,"width":92,"height":15,"fontFamily":"'Inter', sans-serif","fontWeight":400,"fontSize":12,"lineHeight":1.0,"color":"#DCE1E4","textAlign":"left","whiteSpace":"pre"}}>{"Profile & History"}</div>
          </div>
        </div>
        <div data-name="Main content" style={{"position":"absolute","left":0,"top":166,"width":1440,"height":1048,"overflow":"hidden"}}>
          <div style={{"position":"absolute","left":64,"top":64,"width":1312.0,"height":640,"border":"2px dashed #6C8493","background":"rgba(255,255,255,.4)","padding":32,"fontFamily":"ui-monospace,Consolas,monospace","fontSize":14,"lineHeight":1.8,"color":"#2C4C5B"}}>
            <div>[BACKEND SYSTEM - {title.toUpperCase()}]</div>
            <div>Kayo na dito Asher.</div>
          </div>
        </div>
        <div data-name="Public footer" style={{"position":"absolute","left":0,"top":1214,"width":1440,"height":167,"backgroundColor":"#1F313E","overflow":"hidden"}}>
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
