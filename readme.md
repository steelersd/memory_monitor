# Memory Monitor

Monitor's the memory consumption of the Kernel, and shuts down the kernel when a defined threshold is met. This is meant to solve a specific problem when running a Notebook in Jupyter Hub on Kubernetes.

Kubernetes Pods have memory limits. When the Pod exceeds these limits, the Pod will either be deleted,or restarted. This causes issues with Jupyter Hub and it's connection to the Notebook. Restarting the Kernel allows the Notebook to remain operational, hence reducing problems users experience when memory limits are exceeded.

Ideally we would monitor the memory of the Pod, but this requires more advanced K8 integration techniques. A possible future enhancement.

This extension was inspired by [nbresuse](https://github.com/yuvipanda/nbresuse)
