import numpy as np
from scipy.integrate import solve_ivp

# Constants
MU_0 = 4 * np.pi * 1e-7
I    = 1.0

# Coil geometry
coil_radius = 1.0
coil_length = 5.0
turns       = 5
N           = 50

# Build the helix
theta    = np.linspace(0, 2*np.pi*turns, N)
x_coil   = (coil_length/(2*np.pi*turns))*theta - coil_length/2
y_coil   = coil_radius * np.cos(theta)
z_coil   = coil_radius * np.sin(theta)
coil_pts = np.stack([x_coil, y_coil, z_coil], axis=1)
dl       = np.diff(coil_pts, axis=0)
dl       = np.vstack([dl, dl[-1]])  # repeat last segment

def biot_savart_field(r):
    """
    Vectorized Biot–Savart: r is shape (3,),
    coil_pts & dl are (N,3).
    """
    R    = r - coil_pts                         # (N,3)
    rmag = np.linalg.norm(R, axis=1)            # (N,)
    mask = rmag > 1e-6
    Rf   = R[mask]                               # (M,3)
    df   = dl[mask]                              # (M,3)
    rmf  = rmag[mask][:,None]                    # (M,1)
    cross = np.cross(df, Rf)                     # (M,3)
    return (MU_0*I/(4*np.pi)) * np.sum(cross/(rmf**3), axis=0)

def trace_loop_quick(start, length=40.0, npts=20):
    """
    Very fast: no events, exactly npts samples, then force‐close.
    """
    # ODE: dr/dt = B / |B|
    def ode(t, y):
        B = biot_savart_field(y)
        m = np.linalg.norm(B)
        return (B/m) if m>0 else [0,0,0]

    # sample times
    t_eval = np.linspace(0, length, npts)

    sol = solve_ivp(ode,
                    (0, length),
                    start,
                    t_eval=t_eval,
                    max_step=length/npts,  # ~1 step per sample
                    method='RK23')
    pts = sol.y.T

    # force‐close the loop
    pts[-1] = pts[0]
    return pts

if __name__ == "__main__":
    start = np.array([0.0, 0.0, coil_radius*0.5])
    # You may need to tweak `length` (e.g. 30…50) until the loop looks good.
    loop_pts = trace_loop_quick(start, length=80, npts=30)

    print("const fieldLine = [")
    for p in loop_pts:
        print(f"  new THREE.Vector3({p[0]:.4f}, {p[1]:.4f}, {p[2]:.4f}),")
    print("];")