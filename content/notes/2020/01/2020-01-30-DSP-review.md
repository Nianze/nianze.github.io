---
title: "DSP Review"
date: 2020-01-30T12:58:10-05:00
categories:
- music
tags:
- dsp
libraries:
- katex
slug: "2020 01 30 DSP Review"
featured_image: 2020/01/30/waves.jpg
---

A quick review of key concepts in digital signal processing such as aliasing, DFT, convolution, FIR/IIR filters, etc.
<!--more-->

# Aliasing

Waves at frequencies $f$ and $(f + k \cdot f_s)$ look identical when sampled at rate $f_s$. 

If a signal $x$ has frequency content only within the $range \pm B$ Hz, then the sampling rate must be at least $f_s = 2B$ to avoid aliasing.

$f_s/2$ is called the {{< color "#abd282" >}}**Nyquist frequency**{{< /color >}} (for sampling rate $f_s$)

# DFT
> Intuition: cross-correlate the signal against cosine and sine waves of different frequencies. 

$$ X[m] = \sum_{n=0}^{N-1} x[n] \cdot (cos(2 \pi \cdot m \cdot n / N) - j \cdot sin(2 \pi \cdot m \cdot n / N)), m \in [0, N-1] $$

With Euler's formula:

$$ X[m] = \sum_{n=0}^{N-1} x[n] \cdot e^{-j2 \pi \cdot m \cdot n / N} $$

{{< img src="/images/2020/01/30/freq_m.png" >}}

> $m^{th}$ analysis frequency has exactly $m$ cycles over the duration of the signal $N$, and $f_m = m \cdot f_s / N$ HZ. The gap between $f_m$ and $f_{m+1}$ is called the {{< color "#abd282" >}}bin spacing{{< /color >}}

### DFT symmetry
For real valued $x[n]$, 

$$e^{-j \cdot 2 \pi \cdot (N-m) \cdot / N} = e^{+j \cdot 2 \pi \cdot m \cdot m / N}$$

In other words, $X[m] = X^{*}[N-m]$, or frequencies $N/2+1, ..., N-1$ are conjugates of $N/2-1, ..., 1$ (identical real parts, reverded-signed imaginary parts)

## DFT properties

### Shifting
If $x_2[n] = x_1[n-D]$, then $X_2[m] = X_1[m] \cdot e^{-j2 \pi \cdot m \cdot D/N}$ 

- Derivation: 
1. $|X_1[m]| = |X_2[m]|$ 
2. for $x(t) = cos(2 \pi \cdot f_0 \cdot t - \varphi)$, phase offset in the DFT is $e^{-j \varphi}$
3. if $D < N$, then $D/N$ is the proportion of entire signal being delayed, and $X_2[m]$ rotates $m$ times by angle $-2 \pi \cdot D/N$

### Linearity
$$ \sum_{n} (c_1 \cdot x_1[n] + c_2 \cdot x_2[n]) \cdot e^{-j2 \pi \cdot m \cdot n / N} = c_1 \cdot X_1[m] + c_2 \cdot X_2[m] $$

In other words, scale and sum in time domain is equivalent to scale and sum in frequency domain

### Combining linearity and shifting

$$ x[n]= \sum_k A_k e^{-2 \pi \cdot k \cdot n/N - \varphi_k} \Rightarrow X[m] = A_m e^{-j \varphi_m} $$

- when $k = m$, $e^{j2 \pi \cdot (k-m) \cdot n/N} = e^0 = 1$, thus 
$$X[m] = A_m e^{-j \varphi_k}$$
- when $k$ ≠ $m$, the summation over all $n$ cancels out, thus 
$$X[m] = 0$$

## IDFT

$$ x[n] = 1/N \cdot \sum_m X[m] \cdot e^{+j2 \pi \cdot m \cdot n/N} $$

For each term $X[m] \cdot e^{+j2 \pi \cdot m \cdot n/N} = A \cdot e^{j(j \pi \cdot m \cdot n/N + \theta)}$, which is a complex sinusoid with amplitude $A$, phase $\theta$, and frequency $mf_s/N$ [Hz], which is $m$ [cycles per signal duration]. In other words, every signal can be expressed as a weighted sum of sinusoids 

### Spectral leakage

{{< img src="/images/2020/01/30/leakage.png" >}}

>If a digital signal $x[n]$ has energy at frequencies which are not integer multiples of $f_s/N$, then this energy will leak (spread) across multiple DFT frequency bands $X[m]$

{{< img src="/images/2020/01/30/no_cancel_out.png" >}}

>This is caused because such frequencies don't have the whole number of cycles during sampling duration, so comparing to an **analisis frequency** won't cancel out.

In this situation, $X[m]$ measures not just energy associated with the $m^{th}$ analysis frequency, but has contributions from every other non-analysis frequency.

#### Leakage compensation

##### Strategy #1: Have large N

Long signals, high sampling rate $\Rightarrow$ more analysis frequencies, smaller gaps between them

##### Strategy #2: Windowing

>Intuition: force continuity at the edges, eliminate fractional cycles

Before taking the DFT, Multiply $x[n]$ by a **window**, which tapers the ends of the signal to (near) 0:
$$ x[n] \rightarrow w[n] \cdot x[n] $$

**Result**: leakage concentrates on nearby frequencies, and is reduced for distant frequencies; at the same time, analysis frequencies leak to their neighbors as well:

{{< img src="/images/2020/01/30/leakage_compensation.png" >}}

Since in naturally occurring signals, pure tones at exactly $mf_s/N$ hardly happen, we are unlikely to tell apart analysis and non-analysis frequencies. The overall benefits of windowing outweigh the drawbacks

Key properties when designing/choosing a window:

1. Width of the **main lobe**(in Hz or bins): how far does energy smear out locally
2. Hight of the **side lobe**(in dB): how loud is the leakage from distant frequencies

{{< img src="/images/2020/01/30/window_design.png" width=70% >}}

##### STFT (short-time Fourier transform)

# Convolution



# Filters

## FIR filters

## IIR filters

## Filter analysis

