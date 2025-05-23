import numpy as np
from scipy.integrate import solve_ivp

# Constants
MU_0 = 4 * np.pi * 1e-7  # vacuum permeability

# Parameters of the solenoid
I = 1.0          # current in amperes
N = 50           # number of wire segments (adjusted for smooth coil but reasonable speed)
coil_radius = 1.0
coil_length = 5.0
turns = 5

# Generate coil points and segment directions (dl vectors)
theta = np.linspace(0, 2 * np.pi * turns, N)
x_coil = (coil_length / (2 * np.pi * turns)) * theta - coil_length / 2  # along x axis, centered
y_coil = coil_radius * np.cos(theta)
z_coil = coil_radius * np.sin(theta)
coil_points = np.stack([x_coil, y_coil, z_coil], axis=1)

# Compute dl vectors as differences between coil points
dl = np.diff(coil_points, axis=0)
dl = np.vstack([dl, dl[-1]])  # repeat last dl for equal length

def biot_savart_field(r):
    """
    Calculate magnetic field B at point r due to coil segments.
    """
    B = np.zeros(3)
    for i in range(N):
        r_prime = coil_points[i]
        dl_i = dl[i]
        R = r - r_prime
        R_mag = np.linalg.norm(R)
        if R_mag < 1e-6:
            continue
        dB = MU_0 * I / (4 * np.pi) * np.cross(dl_i, R) / (R_mag ** 3)
        B += dB
    return B

def trace_loop(start, length=35, npts=20):
    # 1) ODE
    def ode(t, y):
        B = biot_savart_field(y)
        return B / np.linalg.norm(B) if np.linalg.norm(B)>0 else [0,0,0]

    # 2) t_eval for exact sample count
    t_eval = np.linspace(0, length, npts)

    sol = solve_ivp(ode, (0, length), start,
                    t_eval=t_eval,
                    max_step=length/npts)
    pts = sol.y.T

    # 3) force closure
    pts[-1] = pts[0]
    return pts

if __name__ == "__main__":
    start = np.array([0.0, 0.0, coil_radius*0.5])
    loop_pts = trace_loop(start, length=35, npts=20)

    print("const fieldLine = [")
    for p in loop_pts:
        print(f"    new THREE.Vector3({p[0]:.4f}, {p[1]:.4f}, {p[2]:.4f}),")
    print("];")